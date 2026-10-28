import * as THREE from 'three';

export interface TrafficCar {
  mesh: THREE.Group;
  position: THREE.Vector3;
  heading: number; // radians
  speed: number; // m/s
  lane: 'north' | 'south' | 'east' | 'west';
  color: number;
  width: number;
  length: number;
}

export class TrafficManager {
  public cars: TrafficCar[] = [];
  public trafficGroup: THREE.Group;

  constructor() {
    this.trafficGroup = new THREE.Group();
    this.trafficGroup.name = 'TrafficGroup';
    this.spawnTrafficCars(12);
  }

  private createTrafficCarMesh(colorHex: number): THREE.Group {
    const group = new THREE.Group();

    const carMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      metalness: 0.7,
      roughness: 0.25,
    });

    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x111318,
      metalness: 0.5,
      roughness: 0.5,
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x0a101d,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.8,
    });

    // Lower body
    const bodyGeo = new THREE.BoxGeometry(1.8, 0.5, 3.8);
    const body = new THREE.Mesh(bodyGeo, carMat);
    body.position.y = 0.42;
    body.castShadow = true;
    group.add(body);

    // Cabin
    const cabinGeo = new THREE.BoxGeometry(1.5, 0.45, 2.0);
    const cabin = new THREE.Mesh(cabinGeo, glassMat);
    cabin.position.set(0, 0.82, -0.2);
    group.add(cabin);

    // Wheels
    const tireGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 12);
    tireGeo.rotateZ(Math.PI / 2);

    const w1 = new THREE.Mesh(tireGeo, darkMat);
    w1.position.set(0.9, 0.32, 1.2);
    group.add(w1);

    const w2 = new THREE.Mesh(tireGeo, darkMat);
    w2.position.set(-0.9, 0.32, 1.2);
    group.add(w2);

    const w3 = new THREE.Mesh(tireGeo, darkMat);
    w3.position.set(0.9, 0.32, -1.2);
    group.add(w3);

    const w4 = new THREE.Mesh(tireGeo, darkMat);
    w4.position.set(-0.9, 0.32, -1.2);
    group.add(w4);

    // Headlights
    const headMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const h1 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.1, 0.1), headMat);
    h1.position.set(0.65, 0.42, 1.9);
    group.add(h1);

    const h2 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.1, 0.1), headMat);
    h2.position.set(-0.65, 0.42, 1.9);
    group.add(h2);

    // Taillights
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xff0022 });
    const t1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.1), tailMat);
    t1.position.set(0.65, 0.48, -1.9);
    group.add(t1);

    const t2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.1), tailMat);
    t2.position.set(-0.65, 0.48, -1.9);
    group.add(t2);

    return group;
  }

  private spawnTrafficCars(count: number) {
    const colors = [0x00f0ff, 0xff0055, 0xffbb00, 0x8b5cf6, 0x10b981, 0xe2e8f0, 0x3b82f6];
    const streets = [-180, -90, 0, 90, 180];

    for (let i = 0; i < count; i++) {
      const color = colors[i % colors.length];
      const mesh = this.createTrafficCarMesh(color);
      const isNorthSouth = Math.random() > 0.5;

      let pos = new THREE.Vector3();
      let heading = 0;
      let lane: 'north' | 'south' | 'east' | 'west' = 'north';

      if (isNorthSouth) {
        const streetX = streets[Math.floor(Math.random() * streets.length)];
        const goingSouth = Math.random() > 0.5;
        // Lane offset (right-hand traffic: going south is +X lane, going north is -X lane)
        const laneX = streetX + (goingSouth ? 5.5 : -5.5);
        const z = -200 + Math.random() * 400;
        pos.set(laneX, 0, z);
        heading = goingSouth ? 0 : Math.PI;
        lane = goingSouth ? 'south' : 'north';
      } else {
        const streetZ = streets[Math.floor(Math.random() * streets.length)];
        const goingEast = Math.random() > 0.5;
        const laneZ = streetZ + (goingEast ? 5.5 : -5.5);
        const x = -200 + Math.random() * 400;
        pos.set(x, 0, laneZ);
        heading = goingEast ? Math.PI / 2 : -Math.PI / 2;
        lane = goingEast ? 'east' : 'west';
      }

      mesh.position.copy(pos);
      mesh.rotation.y = heading;
      this.trafficGroup.add(mesh);

      this.cars.push({
        mesh,
        position: pos,
        heading,
        speed: 12 + Math.random() * 8, // ~27 to 45 mph
        lane,
        color,
        width: 1.8,
        length: 3.8,
      });
    }
  }

  public update(dt: number, playerPos: THREE.Vector3): void {
    const cityBound = 240;

    for (let i = 0; i < this.cars.length; i++) {
      const car = this.cars[i];

      // Forward direction vector
      const dirX = Math.sin(car.heading);
      const dirZ = Math.cos(car.heading);

      // Check distance to player
      const distToPlayer = car.position.distanceTo(playerPos);
      let currentSpeed = car.speed;

      // Slow down if player is right ahead
      if (distToPlayer < 18) {
        const toPlayer = playerPos.clone().sub(car.position);
        const dot = toPlayer.x * dirX + toPlayer.z * dirZ;
        if (dot > 0 && Math.abs(toPlayer.x * dirZ - toPlayer.z * dirX) < 3.5) {
          currentSpeed = Math.max(0, currentSpeed * 0.3); // Brake for player
        }
      }

      car.position.x += dirX * currentSpeed * dt;
      car.position.z += dirZ * currentSpeed * dt;

      // Wrap around city boundary
      if (Math.abs(car.position.x) > cityBound) {
        car.position.x = -Math.sign(car.position.x) * (cityBound - 10);
      }
      if (Math.abs(car.position.z) > cityBound) {
        car.position.z = -Math.sign(car.position.z) * (cityBound - 10);
      }

      car.mesh.position.copy(car.position);
      car.mesh.rotation.y = car.heading;
    }
  }

  /**
   * Test collision against player vehicle box
   */
  public checkPlayerCollision(playerPos: THREE.Vector3, playerHalfW: number, playerHalfL: number): boolean {
    for (let i = 0; i < this.cars.length; i++) {
      const c = this.cars[i];
      const dist = playerPos.distanceTo(c.position);
      if (dist < (playerHalfL + c.length / 2)) {
        return true;
      }
    }
    return false;
  }
}
