import * as THREE from 'three';
import {
  createRoadTexture,
  createIntersectionTexture,
  createSkyscraperTexture,
  createNeonBillboardTexture,
} from './proceduralTextures';

export interface CollisionBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  type: 'building' | 'barrier' | 'pillar';
}

export interface CollectibleToken {
  mesh: THREE.Group;
  x: number;
  y: number;
  z: number;
  collected: boolean;
  value: number;
}

export interface CityData {
  cityGroup: THREE.Group;
  collisionBoxes: CollisionBox[];
  collectibles: CollectibleToken[];
  animatedBillboards: THREE.Mesh[];
  animatedPlazaRing: THREE.Object3D;
}

export function buildCyberCity(isSoftwareGl: boolean = false): CityData {
  const cityGroup = new THREE.Group();
  cityGroup.name = 'CyberCity';

  const collisionBoxes: CollisionBox[] = [];
  const collectibles: CollectibleToken[] = [];
  const animatedBillboards: THREE.Mesh[] = [];

  // Textures
  const roadTex = createRoadTexture();
  const interTex = createIntersectionTexture();
  const skyCyanTex = createSkyscraperTexture('#00f0ff');
  const skyMagentaTex = createSkyscraperTexture('#ff007f');
  const skyAmberTex = createSkyscraperTexture('#ffaa00');

  // Materials
  const asphaltMat = new THREE.MeshStandardMaterial({
    map: roadTex,
    roughness: 0.28,
    metalness: 0.35,
  });

  const interMat = new THREE.MeshStandardMaterial({
    map: interTex,
    roughness: 0.3,
    metalness: 0.3,
  });

  const sidewalkMat = new THREE.MeshStandardMaterial({
    color: 0x181c24,
    roughness: 0.8,
    metalness: 0.2,
  });

  const barrierMat = new THREE.MeshStandardMaterial({
    color: 0x222836,
    roughness: 0.5,
    metalness: 0.6,
  });

  const neonBarrierGlowMat = new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
  });

  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x07090d,
    roughness: 0.95,
    metalness: 0.1,
  });

  // Base ground plane (large perimeter)
  const groundGeo = new THREE.PlaneGeometry(1200, 1200);
  groundGeo.rotateX(-Math.PI / 2);
  const groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.position.y = -0.05;
  groundMesh.receiveShadow = true;
  cityGroup.add(groundMesh);

  // --- 1. ROAD NETWORK GENERATION ---
  // City grid coordinates: streets at -180, -90, 0, +90, +180
  const streetCoords = [-180, -90, 0, 90, 180];
  const roadWidth = 24;
  const cityExtent = 260;

  // North-South Roads
  streetCoords.forEach((x) => {
    const roadGeo = new THREE.PlaneGeometry(roadWidth, cityExtent * 2);
    roadGeo.rotateX(-Math.PI / 2);
    const road = new THREE.Mesh(roadGeo, asphaltMat);
    road.position.set(x, 0.01, 0);
    road.receiveShadow = true;
    cityGroup.add(road);

    // Sidewalks on left & right
    const swGeo = new THREE.BoxGeometry(3, 0.2, cityExtent * 2);
    const swLeft = new THREE.Mesh(swGeo, sidewalkMat);
    swLeft.position.set(x - roadWidth / 2 - 1.5, 0.1, 0);
    cityGroup.add(swLeft);

    const swRight = new THREE.Mesh(swGeo, sidewalkMat);
    swRight.position.set(x + roadWidth / 2 + 1.5, 0.1, 0);
    cityGroup.add(swRight);
  });

  // East-West Roads
  streetCoords.forEach((z) => {
    const roadGeo = new THREE.PlaneGeometry(cityExtent * 2, roadWidth);
    roadGeo.rotateX(-Math.PI / 2);
    const road = new THREE.Mesh(roadGeo, asphaltMat);
    road.position.set(0, 0.02, z);
    road.receiveShadow = true;
    cityGroup.add(road);

    // Sidewalks
    const swGeo = new THREE.BoxGeometry(cityExtent * 2, 0.2, 3);
    const swTop = new THREE.Mesh(swGeo, sidewalkMat);
    swTop.position.set(0, 0.1, z - roadWidth / 2 - 1.5);
    cityGroup.add(swTop);

    const swBottom = new THREE.Mesh(swGeo, sidewalkMat);
    swBottom.position.set(0, 0.1, z + roadWidth / 2 + 1.5);
    cityGroup.add(swBottom);
  });

  // Intersections
  streetCoords.forEach((x) => {
    streetCoords.forEach((z) => {
      const interGeo = new THREE.PlaneGeometry(roadWidth, roadWidth);
      interGeo.rotateX(-Math.PI / 2);
      const inter = new THREE.Mesh(interGeo, interMat);
      inter.position.set(x, 0.03, z);
      inter.receiveShadow = true;
      cityGroup.add(inter);
    });
  });

  // --- 2. ELEVATED FLYOVER HIGHWAY ---
  const highwayWidth = 18;
  const highwayLength = 320;
  const highwayHeight = 12;

  const highwayGeo = new THREE.BoxGeometry(highwayWidth, 0.8, highwayLength);
  const highwayMesh = new THREE.Mesh(highwayGeo, asphaltMat);
  highwayMesh.position.set(-60, highwayHeight, 0);
  highwayMesh.receiveShadow = true;
  highwayMesh.castShadow = true;
  cityGroup.add(highwayMesh);

  // Highway guard rails
  const railGeo = new THREE.BoxGeometry(0.4, 1.2, highwayLength);
  const railLeft = new THREE.Mesh(railGeo, barrierMat);
  railLeft.position.set(-60 - highwayWidth / 2, highwayHeight + 0.6, 0);
  cityGroup.add(railLeft);

  const railRight = new THREE.Mesh(railGeo, barrierMat);
  railRight.position.set(-60 + highwayWidth / 2, highwayHeight + 0.6, 0);
  cityGroup.add(railRight);

  // Glowing neon lines on highway rails
  const railGlowGeo = new THREE.BoxGeometry(0.1, 0.15, highwayLength);
  const railGlowL = new THREE.Mesh(railGlowGeo, neonBarrierGlowMat);
  railGlowL.position.set(-60 - highwayWidth / 2 + 0.25, highwayHeight + 1.1, 0);
  cityGroup.add(railGlowL);

  const railGlowR = new THREE.Mesh(railGlowGeo, neonBarrierGlowMat);
  railGlowR.position.set(-60 + highwayWidth / 2 - 0.25, highwayHeight + 1.1, 0);
  cityGroup.add(railGlowR);

  // Highway ramps on both ends
  const rampLength = 90;
  const rampGeo = new THREE.BoxGeometry(highwayWidth, 0.6, rampLength);
  const rampAngle = Math.atan2(highwayHeight, rampLength);

  const rampNorth = new THREE.Mesh(rampGeo, asphaltMat);
  rampNorth.position.set(-60, highwayHeight / 2, highwayLength / 2 + rampLength / 2 - 5);
  rampNorth.rotation.x = -rampAngle;
  cityGroup.add(rampNorth);

  const rampSouth = new THREE.Mesh(rampGeo, asphaltMat);
  rampSouth.position.set(-60, highwayHeight / 2, -highwayLength / 2 - rampLength / 2 + 5);
  rampSouth.rotation.x = rampAngle;
  cityGroup.add(rampSouth);

  // Highway support pillars
  const pillarGeo = new THREE.CylinderGeometry(1.2, 1.5, highwayHeight, 12);
  for (let z = -140; z <= 140; z += 40) {
    const pillar = new THREE.Mesh(pillarGeo, barrierMat);
    pillar.position.set(-60, highwayHeight / 2, z);
    pillar.castShadow = true;
    cityGroup.add(pillar);

    collisionBoxes.push({
      minX: -60 - 1.5,
      maxX: -60 + 1.5,
      minZ: z - 1.5,
      maxZ: z + 1.5,
      type: 'pillar',
    });
  }

  // --- 3. NEON TUNNEL SECTION (along X=90, Z from -70 to 70) ---
  const tunnelZStart = -65;
  const tunnelZEnd = 65;
  const tunnelX = 90;

  // Arches every 10 units
  const archCount = 13;
  for (let i = 0; i < archCount; i++) {
    const az = tunnelZStart + (i / (archCount - 1)) * (tunnelZEnd - tunnelZStart);
    const archGroup = new THREE.Group();
    archGroup.position.set(tunnelX, 0, az);

    // Left post, Right post, Top crossbar
    const postGeo = new THREE.BoxGeometry(0.8, 8, 0.8);
    const crossGeo = new THREE.BoxGeometry(roadWidth + 4, 0.8, 0.8);

    const postL = new THREE.Mesh(postGeo, barrierMat);
    postL.position.set(-roadWidth / 2 - 1.5, 4, 0);
    archGroup.add(postL);

    const postR = new THREE.Mesh(postGeo, barrierMat);
    postR.position.set(roadWidth / 2 + 1.5, 4, 0);
    archGroup.add(postR);

    const cross = new THREE.Mesh(crossGeo, barrierMat);
    cross.position.set(0, 8, 0);
    archGroup.add(cross);

    // Glowing neon strips along arch
    const glowCrossGeo = new THREE.BoxGeometry(roadWidth + 3.8, 0.2, 0.2);
    const neonMat = new THREE.MeshBasicMaterial({
      color: i % 2 === 0 ? 0xff007f : 0x00f0ff,
    });
    const glowCross = new THREE.Mesh(glowCrossGeo, neonMat);
    glowCross.position.set(0, 7.5, 0);
    archGroup.add(glowCross);

    cityGroup.add(archGroup);
  }

  // --- 4. PROCEDURAL SKYSCRAPERS & BILLBOARDS ---
  // Grid blocks: between roads
  const blockCentersX = [-225, -135, -45, 45, 135, 225];
  const blockCentersZ = [-225, -135, -45, 45, 135, 225];

  const billboardTexts = [
    { text: 'NEON DRIVE', sub: 'THE ULTIMATE RACE', color: '#00f0ff' },
    { text: 'CYBERTECH', sub: 'NEURAL CHIP V4', color: '#ff007f' },
    { text: 'NITRO-X', sub: 'OCTANE OVERDRIVE', color: '#ffaa00' },
    { text: 'TOKYO 2099', sub: 'NEO METROPOLIS', color: '#b026ff' },
    { text: 'SYNTHWAVE', sub: 'OUTRUN THE DAWN', color: '#00ff88' },
    { text: 'AERO HYPER', sub: 'BREAK THE BARRIER', color: '#ff0055' },
  ];

  let billboardIndex = 0;

  blockCentersX.forEach((bx) => {
    blockCentersZ.forEach((bz) => {
      // Don't build directly over the highway pillars or central plaza
      if (Math.abs(bx) < 20 && Math.abs(bz) < 20) return; // Leave central plaza open!

      // 1 to 3 skyscrapers per city block
      const count = 2;
      for (let k = 0; k < count; k++) {
        const offX = (k === 0 ? -1 : 1) * 16;
        const offZ = (k === 0 ? 1 : -1) * 16;
        const posX = bx + offX;
        const posZ = bz + offZ;

        const w = 24 + Math.random() * 12;
        const d = 24 + Math.random() * 12;
        const h = 45 + Math.random() * 85;

        // Choose building texture
        const randTex = Math.random();
        const bldTex = randTex < 0.4 ? skyCyanTex : randTex < 0.75 ? skyMagentaTex : skyAmberTex;

        const bldMat = new THREE.MeshStandardMaterial({
          map: bldTex,
          roughness: 0.25,
          metalness: 0.75,
        });

        const bldGeo = new THREE.BoxGeometry(w, h, d);
        const bldMesh = new THREE.Mesh(bldGeo, bldMat);
        bldMesh.position.set(posX, h / 2, posZ);
        bldMesh.castShadow = !isSoftwareGl;
        bldMesh.receiveShadow = true;
        cityGroup.add(bldMesh);

        // Add collision box
        collisionBoxes.push({
          minX: posX - w / 2 - 0.5,
          maxX: posX + w / 2 + 0.5,
          minZ: posZ - d / 2 - 0.5,
          maxZ: posZ + d / 2 + 0.5,
          type: 'building',
        });

        // Rooftop antenna spire
        if (Math.random() > 0.4) {
          const spireGeo = new THREE.CylinderGeometry(0.1, 0.4, 16, 8);
          const spireMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
          const spire = new THREE.Mesh(spireGeo, spireMat);
          spire.position.set(posX, h + 8, posZ);
          cityGroup.add(spire);
        }

        // Animated Holographic Billboard on building facade
        if (Math.random() > 0.35 && billboardIndex < 24) {
          const item = billboardTexts[billboardIndex % billboardTexts.length];
          billboardIndex++;

          const bbTex = createNeonBillboardTexture(item.text, item.sub, item.color);
          const bbMat = new THREE.MeshBasicMaterial({
            map: bbTex,
            side: THREE.DoubleSide,
          });

          const bbWidth = 22;
          const bbHeight = 11;
          const bbGeo = new THREE.PlaneGeometry(bbWidth, bbHeight);
          const bbMesh = new THREE.Mesh(bbGeo, bbMat);

          // Face the nearest road
          const bPosY = 18 + Math.random() * 25;
          if (Math.abs(posX) > Math.abs(posZ)) {
            bbMesh.position.set(posX + (posX > 0 ? -w / 2 - 0.2 : w / 2 + 0.2), bPosY, posZ);
            bbMesh.rotation.y = posX > 0 ? -Math.PI / 2 : Math.PI / 2;
          } else {
            bbMesh.position.set(posX, bPosY, posZ + (posZ > 0 ? -d / 2 - 0.2 : d / 2 + 0.2));
            bbMesh.rotation.y = posZ > 0 ? Math.PI : 0;
          }

          cityGroup.add(bbMesh);
          animatedBillboards.push(bbMesh);
        }
      }
    });
  });

  // --- 5. CENTRAL PLAZA MONUMENT & HOLOGRAPHIC RING ---
  const plazaGroup = new THREE.Group();
  plazaGroup.position.set(0, 0, 0);

  // Plaza base platform
  const platGeo = new THREE.CylinderGeometry(20, 22, 0.4, 32);
  const platMat = new THREE.MeshStandardMaterial({ color: 0x121722, roughness: 0.5, metalness: 0.7 });
  const plat = new THREE.Mesh(platGeo, platMat);
  plat.position.y = 0.2;
  plat.receiveShadow = true;
  plazaGroup.add(plat);

  // Central Obelisk
  const obeliskGeo = new THREE.BoxGeometry(4, 38, 4);
  const obeliskMat = new THREE.MeshStandardMaterial({
    color: 0x050810,
    metalness: 0.95,
    roughness: 0.1,
  });
  const obelisk = new THREE.Mesh(obeliskGeo, obeliskMat);
  obelisk.position.y = 19;
  obelisk.castShadow = true;
  plazaGroup.add(obelisk);

  // Floating rotating cyber ring
  const ringGeo = new THREE.TorusGeometry(10, 0.6, 16, 64);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
    wireframe: true,
  });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.position.y = 22;
  ringMesh.rotation.x = Math.PI / 3;
  plazaGroup.add(ringMesh);

  cityGroup.add(plazaGroup);

  // --- 6. STREET LIGHTS (with glowing lamps) ---
  const lampPoleGeo = new THREE.CylinderGeometry(0.12, 0.16, 9, 8);
  const lampArmGeo = new THREE.BoxGeometry(2.5, 0.15, 0.2);
  const lampHeadGeo = new THREE.BoxGeometry(0.8, 0.2, 0.5);

  const poleMat = new THREE.MeshStandardMaterial({ color: 0x2a3040, metalness: 0.8, roughness: 0.3 });
  const lampGlowMat = new THREE.MeshBasicMaterial({ color: 0x88e0ff });

  // Place lamps along main boulevards
  const lampPositions: { x: number; z: number; rotY: number }[] = [];
  for (let z = -240; z <= 240; z += 40) {
    if (Math.abs(z) > 15) {
      lampPositions.push({ x: -roadWidth / 2 - 2, z, rotY: 0 });
      lampPositions.push({ x: roadWidth / 2 + 2, z, rotY: Math.PI });
    }
  }

  lampPositions.forEach((pos) => {
    const lamp = new THREE.Group();
    lamp.position.set(pos.x, 0, pos.z);
    lamp.rotation.y = pos.rotY;

    const pole = new THREE.Mesh(lampPoleGeo, poleMat);
    pole.position.y = 4.5;
    lamp.add(pole);

    const arm = new THREE.Mesh(lampArmGeo, poleMat);
    arm.position.set(1.2, 8.8, 0);
    lamp.add(arm);

    const head = new THREE.Mesh(lampHeadGeo, lampGlowMat);
    head.position.set(2.2, 8.7, 0);
    lamp.add(head);

    cityGroup.add(lamp);
  });

  // --- 7. SCATTERED NEON CASH TOKENS (Collectibles) ---
  const tokenGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.2, 24);
  tokenGeo.rotateX(Math.PI / 2);
  const tokenMat = new THREE.MeshStandardMaterial({
    color: 0xffbb00,
    emissive: 0xffaa00,
    emissiveIntensity: 2.0,
    metalness: 0.9,
    roughness: 0.1,
  });

  // Preset token spawn locations across streets, tunnel, highway, plaza
  const tokenCoords = [
    { x: 0, y: 1.5, z: 45, val: 500 },
    { x: 0, y: 1.5, z: 120, val: 500 },
    { x: 0, y: 1.5, z: -120, val: 500 },
    { x: 90, y: 1.5, z: 0, val: 750 },
    { x: 90, y: 1.5, z: 35, val: 750 },
    { x: 90, y: 1.5, z: -35, val: 750 },
    { x: -90, y: 1.5, z: 80, val: 500 },
    { x: -90, y: 1.5, z: -80, val: 500 },
    { x: -60, y: 13.5, z: 0, val: 1000 }, // On elevated highway!
    { x: -60, y: 13.5, z: 60, val: 1000 },
    { x: -60, y: 13.5, z: -60, val: 1000 },
    { x: 180, y: 1.5, z: 90, val: 600 },
    { x: -180, y: 1.5, z: -90, val: 600 },
    { x: 45, y: 1.5, z: -180, val: 600 },
    { x: -45, y: 1.5, z: 180, val: 600 },
  ];

  tokenCoords.forEach((tc) => {
    const tokenGroup = new THREE.Group();
    tokenGroup.position.set(tc.x, tc.y, tc.z);

    const tokenMesh = new THREE.Mesh(tokenGeo, tokenMat);
    tokenGroup.add(tokenMesh);

    // Subtle inner glowing icon
    const ringIconGeo = new THREE.TorusGeometry(0.7, 0.08, 8, 16);
    const ringIcon = new THREE.Mesh(ringIconGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    tokenGroup.add(ringIcon);

    cityGroup.add(tokenGroup);

    collectibles.push({
      mesh: tokenGroup,
      x: tc.x,
      y: tc.y,
      z: tc.z,
      collected: false,
      value: tc.val,
    });
  });

  return {
    cityGroup,
    collisionBoxes,
    collectibles,
    animatedBillboards,
    animatedPlazaRing: ringMesh,
  };
}
