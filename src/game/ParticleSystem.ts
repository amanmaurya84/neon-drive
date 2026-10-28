import * as THREE from 'three';

export class ParticleSystem {
  public group: THREE.Group;

  // Rain Particles
  private rainCount: number = 3000;
  private rainGeo: THREE.BufferGeometry | null = null;
  private rainPositions: Float32Array | null = null;
  private rainPoints: THREE.Points | null = null;
  public rainEnabled: boolean = true;

  // Drift Tire Smoke
  private maxSmoke: number = 100;
  private smokeGeo: THREE.BufferGeometry | null = null;
  private smokePositions: Float32Array | null = null;
  private smokeSizes: Float32Array | null = null;
  private smokeOpacities: Float32Array | null = null;
  private smokePoints: THREE.Points | null = null;
  private smokeData: { x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number; maxLife: number }[] = [];

  // Collision Sparks
  private maxSparks: number = 80;
  private sparksGeo: THREE.BufferGeometry | null = null;
  private sparksPositions: Float32Array | null = null;
  private sparksPoints: THREE.Points | null = null;
  private sparksData: { x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number; maxLife: number }[] = [];

  // Nitro Flames
  private maxFlames: number = 60;
  private flamesGeo: THREE.BufferGeometry | null = null;
  private flamesPositions: Float32Array | null = null;
  private flamesPoints: THREE.Points | null = null;
  private flamesData: { x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number; maxLife: number }[] = [];

  constructor(isLowQuality: boolean = false) {
    this.group = new THREE.Group();
    this.group.name = 'ParticleSystem';

    if (isLowQuality) {
      this.rainCount = 1200;
      this.maxSmoke = 50;
      this.maxSparks = 40;
      this.maxFlames = 30;
    }

    this.initRain();
    this.initSmoke();
    this.initSparks();
    this.initFlames();
  }

  private initRain() {
    this.rainPositions = new Float32Array(this.rainCount * 3);
    for (let i = 0; i < this.rainCount; i++) {
      this.rainPositions[i * 3] = (Math.random() - 0.5) * 140;
      this.rainPositions[i * 3 + 1] = Math.random() * 45;
      this.rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 140;
    }

    this.rainGeo = new THREE.BufferGeometry();
    this.rainGeo.setAttribute('position', new THREE.BufferAttribute(this.rainPositions, 3));

    const rainMat = new THREE.PointsMaterial({
      color: 0x88ccff,
      size: 0.22,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.rainPoints = new THREE.Points(this.rainGeo, rainMat);
    this.group.add(this.rainPoints);
  }

  private initSmoke() {
    this.smokePositions = new Float32Array(this.maxSmoke * 3);
    this.smokeSizes = new Float32Array(this.maxSmoke);
    this.smokeOpacities = new Float32Array(this.maxSmoke);

    for (let i = 0; i < this.maxSmoke; i++) {
      this.smokePositions[i * 3 + 1] = -999; // hidden offscreen
      this.smokeSizes[i] = 0;
      this.smokeOpacities[i] = 0;
      this.smokeData.push({ x: 0, y: -999, z: 0, vx: 0, vy: 0, vz: 0, life: 0, maxLife: 1 });
    }

    this.smokeGeo = new THREE.BufferGeometry();
    this.smokeGeo.setAttribute('position', new THREE.BufferAttribute(this.smokePositions, 3));

    const smokeMat = new THREE.PointsMaterial({
      color: 0x99bbdd,
      size: 1.4,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.smokePoints = new THREE.Points(this.smokeGeo, smokeMat);
    this.group.add(this.smokePoints);
  }

  private initSparks() {
    this.sparksPositions = new Float32Array(this.maxSparks * 3);
    for (let i = 0; i < this.maxSparks; i++) {
      this.sparksPositions[i * 3 + 1] = -999;
      this.sparksData.push({ x: 0, y: -999, z: 0, vx: 0, vy: 0, vz: 0, life: 0, maxLife: 0.5 });
    }

    this.sparksGeo = new THREE.BufferGeometry();
    this.sparksGeo.setAttribute('position', new THREE.BufferAttribute(this.sparksPositions, 3));

    const sparksMat = new THREE.PointsMaterial({
      color: 0xffaa33,
      size: 0.45,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.sparksPoints = new THREE.Points(this.sparksGeo, sparksMat);
    this.group.add(this.sparksPoints);
  }

  private initFlames() {
    this.flamesPositions = new Float32Array(this.maxFlames * 3);
    for (let i = 0; i < this.maxFlames; i++) {
      this.flamesPositions[i * 3 + 1] = -999;
      this.flamesData.push({ x: 0, y: -999, z: 0, vx: 0, vy: 0, vz: 0, life: 0, maxLife: 0.25 });
    }

    this.flamesGeo = new THREE.BufferGeometry();
    this.flamesGeo.setAttribute('position', new THREE.BufferAttribute(this.flamesPositions, 3));

    const flamesMat = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 0.6,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.flamesPoints = new THREE.Points(this.flamesGeo, flamesMat);
    this.group.add(this.flamesPoints);
  }

  public emitSmoke(x: number, y: number, z: number, count: number = 2) {
    let emitted = 0;
    for (let i = 0; i < this.maxSmoke && emitted < count; i++) {
      const p = this.smokeData[i];
      if (p.life <= 0) {
        p.x = x + (Math.random() - 0.5) * 0.4;
        p.y = y + 0.15;
        p.z = z + (Math.random() - 0.5) * 0.4;
        p.vx = (Math.random() - 0.5) * 1.5;
        p.vy = 0.5 + Math.random() * 1.5;
        p.vz = (Math.random() - 0.5) * 1.5;
        p.maxLife = 0.8 + Math.random() * 0.5;
        p.life = p.maxLife;
        emitted++;
      }
    }
  }

  public emitSparks(x: number, y: number, z: number, count: number = 15) {
    let emitted = 0;
    for (let i = 0; i < this.maxSparks && emitted < count; i++) {
      const p = this.sparksData[i];
      if (p.life <= 0) {
        p.x = x;
        p.y = y;
        p.z = z;
        const angle = Math.random() * Math.PI * 2;
        const speed = 4 + Math.random() * 8;
        p.vx = Math.cos(angle) * speed;
        p.vy = 2 + Math.random() * 6;
        p.vz = Math.sin(angle) * speed;
        p.maxLife = 0.3 + Math.random() * 0.3;
        p.life = p.maxLife;
        emitted++;
      }
    }
  }

  public emitNitroFlames(x: number, y: number, z: number, heading: number, count: number = 3) {
    let emitted = 0;
    const backwardX = -Math.sin(heading);
    const backwardZ = -Math.cos(heading);

    for (let i = 0; i < this.maxFlames && emitted < count; i++) {
      const p = this.flamesData[i];
      if (p.life <= 0) {
        p.x = x + (Math.random() - 0.5) * 0.3;
        p.y = y + (Math.random() - 0.5) * 0.1;
        p.z = z + (Math.random() - 0.5) * 0.3;
        const speed = 12 + Math.random() * 6;
        p.vx = backwardX * speed + (Math.random() - 0.5) * 1.5;
        p.vy = (Math.random() - 0.5) * 0.5;
        p.vz = backwardZ * speed + (Math.random() - 0.5) * 1.5;
        p.maxLife = 0.18 + Math.random() * 0.1;
        p.life = p.maxLife;
        emitted++;
      }
    }
  }

  public update(dt: number, playerPos: THREE.Vector3): void {
    const clampedDt = Math.min(dt, 0.05);

    // 1. Rain simulation
    if (this.rainPoints && this.rainPositions && this.rainGeo) {
      if (!this.rainEnabled) {
        this.rainPoints.visible = false;
      } else {
        this.rainPoints.visible = true;
        const rainFallSpeed = 45;
        for (let i = 0; i < this.rainCount; i++) {
          let ry = this.rainPositions[i * 3 + 1] - rainFallSpeed * clampedDt;
          let rx = this.rainPositions[i * 3];
          let rz = this.rainPositions[i * 3 + 2];

          // Wrap around relative to player
          if (ry < 0) {
            ry = 45;
            rx = playerPos.x + (Math.random() - 0.5) * 140;
            rz = playerPos.z + (Math.random() - 0.5) * 140;
          } else {
            // Keep rain field centered on player
            if (Math.abs(rx - playerPos.x) > 70) rx = playerPos.x + (Math.random() - 0.5) * 140;
            if (Math.abs(rz - playerPos.z) > 70) rz = playerPos.z + (Math.random() - 0.5) * 140;
          }

          this.rainPositions[i * 3] = rx;
          this.rainPositions[i * 3 + 1] = ry;
          this.rainPositions[i * 3 + 2] = rz;
        }
        this.rainGeo.attributes.position.needsUpdate = true;
      }
    }

    // 2. Drift smoke
    if (this.smokePositions && this.smokeGeo) {
      for (let i = 0; i < this.maxSmoke; i++) {
        const p = this.smokeData[i];
        if (p.life > 0) {
          p.life -= clampedDt;
          p.x += p.vx * clampedDt;
          p.y += p.vy * clampedDt;
          p.z += p.vz * clampedDt;

          this.smokePositions[i * 3] = p.x;
          this.smokePositions[i * 3 + 1] = p.y;
          this.smokePositions[i * 3 + 2] = p.z;
        } else {
          this.smokePositions[i * 3 + 1] = -999;
        }
      }
      this.smokeGeo.attributes.position.needsUpdate = true;
    }

    // 3. Collision sparks
    if (this.sparksPositions && this.sparksGeo) {
      for (let i = 0; i < this.maxSparks; i++) {
        const p = this.sparksData[i];
        if (p.life > 0) {
          p.life -= clampedDt;
          p.vy -= 9.8 * clampedDt; // gravity
          p.x += p.vx * clampedDt;
          p.y += p.vy * clampedDt;
          p.z += p.vz * clampedDt;

          this.sparksPositions[i * 3] = p.x;
          this.sparksPositions[i * 3 + 1] = Math.max(0.1, p.y);
          this.sparksPositions[i * 3 + 2] = p.z;
        } else {
          this.sparksPositions[i * 3 + 1] = -999;
        }
      }
      this.sparksGeo.attributes.position.needsUpdate = true;
    }

    // 4. Nitro flames
    if (this.flamesPositions && this.flamesGeo) {
      for (let i = 0; i < this.maxFlames; i++) {
        const p = this.flamesData[i];
        if (p.life > 0) {
          p.life -= clampedDt;
          p.x += p.vx * clampedDt;
          p.y += p.vy * clampedDt;
          p.z += p.vz * clampedDt;

          this.flamesPositions[i * 3] = p.x;
          this.flamesPositions[i * 3 + 1] = p.y;
          this.flamesPositions[i * 3 + 2] = p.z;
        } else {
          this.flamesPositions[i * 3 + 1] = -999;
        }
      }
      this.flamesGeo.attributes.position.needsUpdate = true;
    }
  }
}
