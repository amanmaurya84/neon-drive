import * as THREE from 'three';
import { CollisionBox } from './CityBuilder';
import { PlayerControls, CarStats } from '../types/game';
import { soundManager } from '../audio/SoundManager';

export interface VehiclePhysicsState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  speedMph: number;
  heading: number; // yaw angle in radians
  pitch: number;
  roll: number;
  steeringAngle: number;
  slipAngle: number;
  isDrifting: boolean;
  driftScore: number;
  driftMultiplier: number;
  nitro: number; // 0 to 100
  isNitroActive: boolean;
  rpm: number;
  gear: number | string; // 1-6 or 'R' or 'N'
  health: number; // 0 to 100
  lastCollisionImpact: number; // 0 to 1
  steerInput: number;
}

export class VehiclePhysics {
  public state: VehiclePhysicsState;
  private carStats: CarStats;
  private driftTimer: number = 0;
  private maxNitro: number = 100;
  private collisionBoxes: CollisionBox[] = [];

  // Vehicle Dimensions & Bounds
  public halfLength: number = 2.1;
  public halfWidth: number = 1.0;

  // Collision cooldown
  private collisionCooldown: number = 0;

  constructor(initialStats: CarStats, startX: number = 0, startZ: number = 30) {
    this.carStats = initialStats;
    this.state = {
      position: new THREE.Vector3(startX, 0.36, startZ),
      velocity: new THREE.Vector3(0, 0, 0),
      speedMph: 0,
      heading: 0,
      pitch: 0,
      roll: 0,
      steeringAngle: 0,
      slipAngle: 0,
      isDrifting: false,
      driftScore: 0,
      driftMultiplier: 1.0,
      nitro: 100,
      isNitroActive: false,
      rpm: 1000,
      gear: 1,
      health: 100,
      lastCollisionImpact: 0,
      steerInput: 0,
    };
  }

  public setCarStats(stats: CarStats) {
    this.carStats = stats;
  }

  public setCollisionBoxes(boxes: CollisionBox[]) {
    this.collisionBoxes = boxes;
  }

  public reset(x: number = 0, z: number = 30, heading: number = 0) {
    this.state.position.set(x, 0.36, z);
    this.state.velocity.set(0, 0, 0);
    this.state.speedMph = 0;
    this.state.heading = heading;
    this.state.pitch = 0;
    this.state.roll = 0;
    this.state.steeringAngle = 0;
    this.state.slipAngle = 0;
    this.state.isDrifting = false;
    this.state.nitro = Math.max(50, this.state.nitro);
    this.state.rpm = 1000;
    this.state.gear = 1;
    this.state.lastCollisionImpact = 0;
  }

  public repair() {
    this.state.health = 100;
  }

  public update(dt: number, controls: PlayerControls): void {
    const clampedDt = Math.min(dt, 0.05);
    if (this.collisionCooldown > 0) {
      this.collisionCooldown -= clampedDt;
    }
    this.state.lastCollisionImpact = 0;

    // --- 1. NITRO BOOST LOGIC ---
    let nitroMultiplier = 1.0;
    if (controls.nitro && this.state.nitro > 2 && (controls.forward || this.state.speedMph > 20)) {
      this.state.isNitroActive = true;
      this.state.nitro = Math.max(0, this.state.nitro - 25 * clampedDt);
      nitroMultiplier = 1.55;
      soundManager.setNitro(true);
    } else {
      this.state.isNitroActive = false;
      soundManager.setNitro(false);
      // Slow passive nitro recharge
      this.state.nitro = Math.min(this.maxNitro, this.state.nitro + 4 * clampedDt);
    }

    // --- 2. STEERING HANDLING ---
    const targetSteer = (controls.left ? 1 : 0) - (controls.right ? 1 : 0);
    this.state.steerInput = targetSteer;

    // High speed reduces max steer angle for stability
    const speedRatio = Math.min(1.0, this.state.speedMph / 140);
    const maxSteer = 0.55 - speedRatio * 0.28;
    const steerSpeed = (this.carStats.handling * 5 + 4.5);

    this.state.steeringAngle = THREE.MathUtils.damp(
      this.state.steeringAngle,
      targetSteer * maxSteer,
      steerSpeed,
      clampedDt
    );

    // --- 3. FORWARD / REVERSE ACCELERATION & BRAKING ---
    const topSpeedLimit = (this.carStats.topSpeed * (this.state.isNitroActive ? 1.25 : 1.0)) * 0.44704; // to m/s
    const accelPower = 18.0 * (0.8 + this.carStats.acceleration * 0.8) * nitroMultiplier;
    const brakePower = 28.0;

    // Local forward and right vectors
    const forwardVec = new THREE.Vector3(Math.sin(this.state.heading), 0, Math.cos(this.state.heading));
    const rightVec = new THREE.Vector3(Math.cos(this.state.heading), 0, -Math.sin(this.state.heading));

    // Current forward speed (m/s)
    let forwardSpeed = this.state.velocity.dot(forwardVec);
    let lateralSpeed = this.state.velocity.dot(rightVec);

    // Handbrake modifies drift lateral friction
    const isHandbrake = controls.handbrake;
    let lateralGrip = isHandbrake ? 0.35 : 0.88;

    if (controls.forward) {
      if (forwardSpeed < -1.0) {
        // Braking while in reverse
        forwardSpeed += brakePower * clampedDt;
      } else {
        // Accelerating forward
        const powerFalloff = Math.max(0.1, 1.0 - Math.abs(forwardSpeed) / topSpeedLimit);
        forwardSpeed += accelPower * powerFalloff * clampedDt;
      }
    } else if (controls.backward) {
      if (forwardSpeed > 1.0) {
        // Braking from forward drive
        forwardSpeed -= brakePower * clampedDt;
      } else {
        // Reversing
        const reverseTopSpeed = 14.0; // ~31 mph
        if (Math.abs(forwardSpeed) < reverseTopSpeed) {
          forwardSpeed -= accelPower * 0.5 * clampedDt;
        }
      }
    } else {
      // Natural rolling resistance and air drag
      const drag = 0.985 - Math.min(0.05, Math.abs(forwardSpeed) * 0.0008);
      forwardSpeed *= Math.pow(drag, clampedDt * 60);
    }

    if (isHandbrake) {
      forwardSpeed *= Math.pow(0.96, clampedDt * 60);
    }

    // Apply lateral damping (tire grip)
    lateralSpeed *= Math.pow(1.0 - lateralGrip, clampedDt * 30);

    // Turn rate based on steering and speed
    const turnSensitivity = 2.4 * (0.7 + this.carStats.handling * 0.5);
    const speedTurnFactor = Math.min(1.0, Math.abs(forwardSpeed) / 4.0);
    const reverseTurnFactor = forwardSpeed < -0.1 ? -1 : 1;

    let yawRate = this.state.steeringAngle * turnSensitivity * speedTurnFactor * reverseTurnFactor;

    // In a drift / handbrake, give extra rotational kick
    if (isHandbrake && Math.abs(forwardSpeed) > 8.0) {
      yawRate *= 1.45 * (1.0 + this.carStats.driftFactor * 0.4);
    }

    this.state.heading += yawRate * clampedDt;

    // Reconstruct velocity from forward & lateral components
    const updatedForward = new THREE.Vector3(Math.sin(this.state.heading), 0, Math.cos(this.state.heading));
    const updatedRight = new THREE.Vector3(Math.cos(this.state.heading), 0, -Math.sin(this.state.heading));

    this.state.velocity.copy(updatedForward).multiplyScalar(forwardSpeed).add(updatedRight.clone().multiplyScalar(lateralSpeed));

    // Calculate speed in MPH
    const totalSpeedMs = this.state.velocity.length();
    this.state.speedMph = Math.round(totalSpeedMs * 2.23694);

    // --- 4. DRIFTING & SLIP DETECTION ---
    if (totalSpeedMs > 4.0) {
      const headingDir = new THREE.Vector3(Math.sin(this.state.heading), 0, Math.cos(this.state.heading));
      const velDir = this.state.velocity.clone().normalize();
      const dot = Math.max(-1, Math.min(1, headingDir.dot(velDir)));
      this.state.slipAngle = Math.acos(dot);
    } else {
      this.state.slipAngle = 0;
    }

    const driftThreshold = isHandbrake ? 0.18 : 0.32;
    if (this.state.slipAngle > driftThreshold && this.state.speedMph > 22) {
      this.state.isDrifting = true;
      this.driftTimer += clampedDt;
      this.state.driftMultiplier = Math.min(5.0, 1.0 + Math.floor(this.driftTimer / 1.5) * 0.5);

      const pointsEarned = Math.round(this.state.slipAngle * this.state.speedMph * this.state.driftMultiplier * clampedDt * 35);
      this.state.driftScore += pointsEarned;

      // Drifting refills nitro faster!
      this.state.nitro = Math.min(this.maxNitro, this.state.nitro + 12 * clampedDt);

      soundManager.updateSkid(Math.min(1.0, this.state.slipAngle * 2.2));
    } else {
      this.state.isDrifting = false;
      this.driftTimer = Math.max(0, this.driftTimer - clampedDt * 2);
      if (this.driftTimer === 0) {
        this.state.driftMultiplier = 1.0;
      }
      soundManager.updateSkid(0);
    }

    // --- 5. TRANSMISSION & RPM ENGINE SIMULATION ---
    const currentMph = this.state.speedMph;
    if (forwardSpeed < -0.5) {
      this.state.gear = 'R';
      this.state.rpm = 1000 + Math.min(6000, Math.abs(currentMph) * 180);
    } else if (currentMph < 1) {
      this.state.gear = 'N';
      this.state.rpm = controls.forward ? 3500 : 900;
    } else {
      // 6-speed automatic gearbox
      const gearRatios = [0, 28, 52, 80, 115, 155, 230];
      let currentGear = 1;
      for (let g = 1; g <= 6; g++) {
        if (currentMph <= gearRatios[g] || g === 6) {
          currentGear = g;
          break;
        }
      }

      if (currentGear !== this.state.gear) {
        soundManager.playGearShift();
      }
      this.state.gear = currentGear;

      const minGearSpeed = currentGear === 1 ? 0 : gearRatios[currentGear - 1];
      const maxGearSpeed = gearRatios[currentGear];
      const speedInGear = (currentMph - minGearSpeed) / Math.max(1, maxGearSpeed - minGearSpeed);
      this.state.rpm = 2000 + Math.min(6500, speedInGear * 5500);
    }

    soundManager.updateEngine(
      this.state.rpm,
      8000,
      controls.forward ? 1.0 : 0.0,
      controls.backward && forwardSpeed > 1
    );

    // --- 6. POSITION UPDATE & COLLISION HANDLING ---
    const nextPos = this.state.position.clone().add(this.state.velocity.clone().multiplyScalar(clampedDt));

    // Check collision against city bounding boxes
    const hasCollision = this.checkCollisions(nextPos);
    if (!hasCollision) {
      this.state.position.copy(nextPos);
    }

    // Elevated highway vertical adjustment
    // If on highway coordinates (X around -60, Z between -160 and 160)
    if (Math.abs(this.state.position.x - (-60)) < 8 && Math.abs(this.state.position.z) < 160) {
      this.state.position.y = THREE.MathUtils.damp(this.state.position.y, 12.36, 6, clampedDt);
    } else {
      this.state.position.y = THREE.MathUtils.damp(this.state.position.y, 0.36, 12, clampedDt);
    }

    // Subtle chassis pitch and roll for weight transfer
    const accelPitch = (controls.forward ? -0.04 : 0) + (controls.backward ? 0.05 : 0);
    const steerRoll = -this.state.steeringAngle * 0.08 * (this.state.speedMph / 80);
    this.state.pitch = THREE.MathUtils.damp(this.state.pitch, accelPitch, 10, clampedDt);
    this.state.roll = THREE.MathUtils.damp(this.state.roll, steerRoll, 10, clampedDt);
  }

  private checkCollisions(nextPos: THREE.Vector3): boolean {
    const carMinX = nextPos.x - this.halfWidth;
    const carMaxX = nextPos.x + this.halfWidth;
    const carMinZ = nextPos.z - this.halfLength;
    const carMaxZ = nextPos.z + this.halfLength;

    // City outer boundary limit
    const cityLimit = 255;
    if (Math.abs(nextPos.x) > cityLimit || Math.abs(nextPos.z) > cityLimit) {
      this.triggerImpact(0.5);
      this.state.velocity.multiplyScalar(-0.35);
      return true;
    }

    for (let i = 0; i < this.collisionBoxes.length; i++) {
      const box = this.collisionBoxes[i];
      // Only check collisions if vehicle is on same vertical height band
      if (this.state.position.y > 6 && box.type === 'building') {
        // High elevation
      }

      if (
        carMaxX > box.minX &&
        carMinX < box.maxX &&
        carMaxZ > box.minZ &&
        carMinZ < box.maxZ
      ) {
        if (this.collisionCooldown <= 0) {
          const impactSpeed = this.state.velocity.length();
          const impactRatio = Math.min(1.0, impactSpeed / 30);
          this.triggerImpact(impactRatio);

          // Deduct vehicle durability
          const damage = Math.round(impactRatio * 18);
          this.state.health = Math.max(0, this.state.health - damage);

          // Bounce back
          this.state.velocity.multiplyScalar(-0.35);
          this.collisionCooldown = 0.3;
        }
        return true;
      }
    }

    return false;
  }

  private triggerImpact(impactRatio: number) {
    this.state.lastCollisionImpact = impactRatio;
    soundManager.playCollision(impactRatio);
  }
}
