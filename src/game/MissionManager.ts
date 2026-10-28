import * as THREE from 'three';
import { Mission } from '../types/game';
import { soundManager } from '../audio/SoundManager';

export const MISSIONS_DATA: Mission[] = [
  {
    id: 'sprint_1',
    title: 'Downtown Neon Sprint',
    description: 'Sprint through the illuminated skyscraper grid, dash into the neon tunnel, and cross the plaza finish line.',
    type: 'sprint',
    reward: 2500,
    timeLimit: 80,
    completed: false,
    checkpoints: [
      { x: 0, z: 50, radius: 14 },
      { x: 0, z: 120, radius: 14 },
      { x: 45, z: 180, radius: 14 },
      { x: 90, z: 120, radius: 14 },
      { x: 90, z: 30, radius: 14 }, // entering tunnel
      { x: 90, z: -50, radius: 14 }, // tunnel exit
      { x: 0, z: -90, radius: 14 },
      { x: 0, z: 0, radius: 16 }, // Finish line at Plaza
    ],
  },
  {
    id: 'highway_1',
    title: 'Cyber Highway Blitz',
    description: 'Hit top speed on the elevated flyover bridge! Maintain 120+ mph while weaving through highway checkpoints.',
    type: 'highway',
    reward: 3500,
    timeLimit: 60,
    completed: false,
    checkpoints: [
      { x: 0, z: 80, radius: 14 },
      { x: -60, z: 120, radius: 14 }, // Ramp base
      { x: -60, z: 50, radius: 14 }, // Highway high
      { x: -60, z: -40, radius: 14 },
      { x: -60, z: -110, radius: 14 }, // Down ramp
      { x: -90, z: -180, radius: 16 }, // Highway finish
    ],
  },
  {
    id: 'drift_king',
    title: 'Tokyo Drift Overdrive',
    description: 'Throw your sports car sideways! Accumulate 12,000 drift points within the 60-second timer.',
    type: 'drift',
    reward: 4500,
    timeLimit: 60,
    targetDriftScore: 12000,
    completed: false,
    checkpoints: [
      { x: 0, z: 60, radius: 18 },
      { x: 90, z: 60, radius: 18 },
      { x: 90, z: -60, radius: 18 },
      { x: -90, z: -60, radius: 18 },
      { x: -90, z: 60, radius: 18 },
    ],
  },
  {
    id: 'time_attack',
    title: 'Midnight Ring Time Attack',
    description: 'Full perimeter loop around the outer cyber megacity ring. Complete the circuit under 70 seconds.',
    type: 'timeattack',
    reward: 5000,
    timeLimit: 75,
    completed: false,
    checkpoints: [
      { x: 0, z: 180, radius: 16 },
      { x: 180, z: 180, radius: 16 },
      { x: 180, z: -180, radius: 16 },
      { x: -180, z: -180, radius: 16 },
      { x: -180, z: 180, radius: 16 },
      { x: 0, z: 180, radius: 18 },
    ],
  },
];

export class MissionManager {
  public activeMission: Mission | null = null;
  public currentCheckpointIndex: number = 0;
  public elapsedTime: number = 0;
  public isRacing: boolean = false;
  public countdown: number = 0; // 3, 2, 1, 0
  public isCountdownActive: boolean = false;
  private checkpointMesh: THREE.Group;
  public group: THREE.Group;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'MissionGroup';

    this.checkpointMesh = this.createCheckpointVisual();
    this.checkpointMesh.visible = false;
    this.group.add(this.checkpointMesh);
  }

  private createCheckpointVisual(): THREE.Group {
    const grp = new THREE.Group();

    // Outer glowing ring
    const ringGeo = new THREE.TorusGeometry(7, 0.4, 16, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.85,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.5;
    grp.add(ring);

    // Vertical neon light beam column
    const beamGeo = new THREE.CylinderGeometry(6.8, 6.8, 25, 24, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 12.5;
    grp.add(beam);

    // Floating center chevron / marker
    const markerGeo = new THREE.ConeGeometry(1.5, 3, 4);
    markerGeo.rotateX(Math.PI);
    const markerMat = new THREE.MeshBasicMaterial({ color: 0xff007f });
    const marker = new THREE.Mesh(markerGeo, markerMat);
    marker.position.y = 8;
    grp.add(marker);

    return grp;
  }

  public startMission(mission: Mission): void {
    this.activeMission = { ...mission };
    this.currentCheckpointIndex = 0;
    this.elapsedTime = 0;
    this.isRacing = false;
    this.isCountdownActive = true;
    this.countdown = 3.99;
    this.updateCheckpointVisual();
  }

  public cancelMission(): void {
    this.activeMission = null;
    this.isRacing = false;
    this.isCountdownActive = false;
    this.checkpointMesh.visible = false;
  }

  private updateCheckpointVisual(): void {
    if (!this.activeMission || this.currentCheckpointIndex >= this.activeMission.checkpoints.length) {
      this.checkpointMesh.visible = false;
      return;
    }

    const cp = this.activeMission.checkpoints[this.currentCheckpointIndex];
    const isFinish = this.currentCheckpointIndex === this.activeMission.checkpoints.length - 1;

    this.checkpointMesh.position.set(cp.x, 0.2, cp.z);
    this.checkpointMesh.visible = true;

    // Finish line changes color to magenta/gold
    const ringMesh = this.checkpointMesh.children[0] as THREE.Mesh;
    const beamMesh = this.checkpointMesh.children[1] as THREE.Mesh;
    if (ringMesh.material instanceof THREE.MeshBasicMaterial && beamMesh.material instanceof THREE.MeshBasicMaterial) {
      const colorHex = isFinish ? 0xffbb00 : 0x00f0ff;
      ringMesh.material.color.setHex(colorHex);
      beamMesh.material.color.setHex(colorHex);
    }
  }

  public update(
    dt: number,
    playerPos: THREE.Vector3,
    driftScore: number,
    onComplete: (mission: Mission, success: boolean, reward: number, time: number) => void
  ): void {
    // 1. Countdown handler
    if (this.isCountdownActive) {
      const prevSeconds = Math.ceil(this.countdown);
      this.countdown -= dt;
      const currentSeconds = Math.ceil(this.countdown);

      if (currentSeconds !== prevSeconds && currentSeconds >= 1) {
        soundManager.playCountdown(false);
      }

      if (this.countdown <= 0) {
        this.isCountdownActive = false;
        this.isRacing = true;
        soundManager.playCountdown(true);
      }
      return;
    }

    if (!this.activeMission || !this.isRacing) return;

    this.elapsedTime += dt;

    // Rotate visual checkpoint ring
    this.checkpointMesh.rotation.y += dt * 1.5;

    // Check time limit
    if (this.activeMission.timeLimit && this.elapsedTime > this.activeMission.timeLimit) {
      this.isRacing = false;
      onComplete(this.activeMission, false, 0, this.elapsedTime);
      return;
    }

    // Check drift goal (for drift king)
    if (this.activeMission.type === 'drift' && this.activeMission.targetDriftScore) {
      if (driftScore >= this.activeMission.targetDriftScore) {
        this.isRacing = false;
        this.checkpointMesh.visible = false;
        soundManager.playCashEarned();
        onComplete(this.activeMission, true, this.activeMission.reward, this.elapsedTime);
        return;
      }
    }

    // Check Checkpoint collision
    const cp = this.activeMission.checkpoints[this.currentCheckpointIndex];
    const distToCp = Math.hypot(playerPos.x - cp.x, playerPos.z - cp.z);

    if (distToCp < cp.radius) {
      soundManager.playCheckpoint();
      this.currentCheckpointIndex++;

      // Check if race completed
      if (this.currentCheckpointIndex >= this.activeMission.checkpoints.length) {
        this.isRacing = false;
        this.checkpointMesh.visible = false;
        soundManager.playCashEarned();
        onComplete(this.activeMission, true, this.activeMission.reward, this.elapsedTime);
      } else {
        this.updateCheckpointVisual();
      }
    }
  }

  public getNextCheckpointDirection(playerPos: THREE.Vector3, heading: number): number {
    if (!this.activeMission || this.currentCheckpointIndex >= this.activeMission.checkpoints.length) {
      return 0;
    }
    const cp = this.activeMission.checkpoints[this.currentCheckpointIndex];
    const dx = cp.x - playerPos.x;
    const dz = cp.z - playerPos.z;
    const angleToCp = Math.atan2(dx, dz);
    let diff = angleToCp - heading;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return diff;
  }
}
