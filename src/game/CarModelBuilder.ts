import * as THREE from 'three';
import { createCarbonFiberTexture, createTireTexture } from './proceduralTextures';

export interface CarMeshes {
  root: THREE.Group;
  bodyMesh: THREE.Mesh;
  wheelFrontLeft: THREE.Group;
  wheelFrontRight: THREE.Group;
  wheelRearLeft: THREE.Group;
  wheelRearRight: THREE.Group;
  headlights: THREE.Mesh[];
  taillights: THREE.Mesh[];
  headlightSpotLeft: THREE.SpotLight;
  headlightSpotRight: THREE.SpotLight;
  taillightPoint: THREE.PointLight;
  underglowMesh: THREE.Mesh;
  exhaustMeshes: THREE.Mesh[];
}

export function buildCarModel(
  carId: string = 'specter',
  paintColor: string = '#00f0ff',
  underglowColor: string = '#00f0ff',
  wheelColor: string = '#cccccc'
): CarMeshes {
  const root = new THREE.Group();
  root.name = `car_${carId}`;

  const carbonTex = createCarbonFiberTexture();
  const tireTex = createTireTexture();

  // Materials
  const paintMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(paintColor),
    metalness: 0.88,
    roughness: 0.14,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    reflectivity: 0.9,
  });

  const darkTrimMat = new THREE.MeshStandardMaterial({
    color: 0x11141a,
    metalness: 0.4,
    roughness: 0.6,
  });

  const carbonMat = new THREE.MeshStandardMaterial({
    map: carbonTex,
    roughness: 0.4,
    metalness: 0.6,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x050a12,
    metalness: 0.9,
    roughness: 0.05,
    transparent: true,
    opacity: 0.75,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(wheelColor),
    metalness: 0.95,
    roughness: 0.1,
  });

  const brakeCaliperMat = new THREE.MeshStandardMaterial({
    color: 0xff0044,
    metalness: 0.6,
    roughness: 0.2,
  });

  const tireMat = new THREE.MeshStandardMaterial({
    map: tireTex,
    color: 0x1a1a1a,
    roughness: 0.9,
    metalness: 0.05,
  });

  const headlightMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
  });

  const taillightMat = new THREE.MeshStandardMaterial({
    color: 0xff0033,
    emissive: 0xff0022,
    emissiveIntensity: 3.5,
    roughness: 0.2,
  });

  const underglowMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(underglowColor),
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  // --- 1. CHASSIS / LOWER BODY ---
  const bodyGroup = new THREE.Group();

  let bodyLength = 4.2;
  let bodyWidth = 1.9;
  let bodyHeight = 0.55;

  if (carId === 'apex') {
    bodyLength = 4.4;
    bodyWidth = 2.05;
    bodyHeight = 0.5;
  } else if (carId === 'viper') {
    bodyLength = 4.1;
    bodyWidth = 1.95;
    bodyHeight = 0.58;
  }

  // Lower chassis
  const chassisGeo = new THREE.BoxGeometry(bodyWidth, bodyHeight, bodyLength);
  const chassisMesh = new THREE.Mesh(chassisGeo, paintMat);
  chassisMesh.position.y = 0.45;
  chassisMesh.castShadow = true;
  chassisMesh.receiveShadow = true;
  bodyGroup.add(chassisMesh);

  // Front wedge hood
  const hoodShape = new THREE.Shape();
  hoodShape.moveTo(-bodyWidth * 0.48, 0);
  hoodShape.lineTo(bodyWidth * 0.48, 0);
  hoodShape.lineTo(bodyWidth * 0.42, 1.4);
  hoodShape.lineTo(-bodyWidth * 0.42, 1.4);
  hoodShape.closePath();

  const extrudeSettings = { depth: 0.18, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.04, bevelThickness: 0.04 };
  const hoodGeo = new THREE.ExtrudeGeometry(hoodShape, extrudeSettings);
  hoodGeo.rotateX(Math.PI / 2);
  const hoodMesh = new THREE.Mesh(hoodGeo, paintMat);
  hoodMesh.position.set(0, 0.64, 0.5);
  hoodMesh.castShadow = true;
  bodyGroup.add(hoodMesh);

  // --- 2. CABIN & WINDSHIELD ---
  const cabinWidth = bodyWidth * 0.78;
  const cabinLength = bodyLength * 0.46;
  const cabinHeight = 0.52;

  const cabinGeo = new THREE.BoxGeometry(cabinWidth, cabinHeight, cabinLength);
  const cabinMesh = new THREE.Mesh(cabinGeo, paintMat);
  cabinMesh.position.set(0, 0.88, -0.2);
  cabinMesh.castShadow = true;
  bodyGroup.add(cabinMesh);

  // Glass windshield (front angled)
  const windshieldGeo = new THREE.PlaneGeometry(cabinWidth * 0.94, 0.72);
  const windshieldMesh = new THREE.Mesh(windshieldGeo, glassMat);
  windshieldMesh.position.set(0, 0.88, 0.58);
  windshieldMesh.rotation.x = -Math.PI / 3.4;
  bodyGroup.add(windshieldMesh);

  // Glass rear window
  const rearWindowGeo = new THREE.PlaneGeometry(cabinWidth * 0.92, 0.65);
  const rearWindowMesh = new THREE.Mesh(rearWindowGeo, glassMat);
  rearWindowMesh.position.set(0, 0.88, -0.96);
  rearWindowMesh.rotation.x = Math.PI / 3.2;
  bodyGroup.add(rearWindowMesh);

  // Glass side windows
  const sideWindowGeo = new THREE.PlaneGeometry(cabinLength * 0.85, 0.38);
  const leftWindow = new THREE.Mesh(sideWindowGeo, glassMat);
  leftWindow.position.set(cabinWidth * 0.505, 0.88, -0.2);
  leftWindow.rotation.y = Math.PI / 2;
  bodyGroup.add(leftWindow);

  const rightWindow = new THREE.Mesh(sideWindowGeo, glassMat);
  rightWindow.position.set(-cabinWidth * 0.505, 0.88, -0.2);
  rightWindow.rotation.y = -Math.PI / 2;
  bodyGroup.add(rightWindow);

  // Front Splitter / Lip
  const splitterGeo = new THREE.BoxGeometry(bodyWidth * 1.05, 0.06, 0.6);
  const splitter = new THREE.Mesh(splitterGeo, carbonMat);
  splitter.position.set(0, 0.18, bodyLength * 0.5 + 0.1);
  splitter.castShadow = true;
  bodyGroup.add(splitter);

  // Rear Diffuser
  const diffuserGeo = new THREE.BoxGeometry(bodyWidth * 0.95, 0.18, 0.4);
  const diffuser = new THREE.Mesh(diffuserGeo, carbonMat);
  diffuser.position.set(0, 0.22, -bodyLength * 0.5 - 0.05);
  diffuser.castShadow = true;
  bodyGroup.add(diffuser);

  // --- 3. REAR SPOILER / WING ---
  if (carId === 'apex' || carId === 'specter') {
    const wingWidth = bodyWidth * 1.1;
    const wingGeo = new THREE.BoxGeometry(wingWidth, 0.04, 0.35);
    const wingMesh = new THREE.Mesh(wingGeo, carbonMat);
    wingMesh.position.set(0, 1.25, -bodyLength * 0.46);
    wingMesh.castShadow = true;
    bodyGroup.add(wingMesh);

    // Twin upright struts
    const strutGeo = new THREE.BoxGeometry(0.04, 0.4, 0.15);
    const strutLeft = new THREE.Mesh(strutGeo, darkTrimMat);
    strutLeft.position.set(wingWidth * 0.35, 1.05, -bodyLength * 0.46);
    bodyGroup.add(strutLeft);

    const strutRight = new THREE.Mesh(strutGeo, darkTrimMat);
    strutRight.position.set(-wingWidth * 0.35, 1.05, -bodyLength * 0.46);
    bodyGroup.add(strutRight);
  } else {
    // Ducktail spoiler for viper
    const ducktailGeo = new THREE.BoxGeometry(bodyWidth * 0.9, 0.12, 0.2);
    const ducktail = new THREE.Mesh(ducktailGeo, carbonMat);
    ducktail.position.set(0, 0.78, -bodyLength * 0.48);
    ducktail.rotation.x = 0.3;
    bodyGroup.add(ducktail);
  }

  // --- 4. HEADLIGHTS & TAILLIGHTS ---
  const headlights: THREE.Mesh[] = [];
  const headGeo = new THREE.BoxGeometry(0.35, 0.08, 0.15);

  const headLeft = new THREE.Mesh(headGeo, headlightMat);
  headLeft.position.set(bodyWidth * 0.36, 0.48, bodyLength * 0.5 - 0.02);
  bodyGroup.add(headLeft);
  headlights.push(headLeft);

  const headRight = new THREE.Mesh(headGeo, headlightMat);
  headRight.position.set(-bodyWidth * 0.36, 0.48, bodyLength * 0.5 - 0.02);
  bodyGroup.add(headRight);
  headlights.push(headRight);

  // Headlight Spotlights projecting onto the road
  const headlightSpotLeft = new THREE.SpotLight(0xaae8ff, 60, 45, Math.PI / 6, 0.4, 1.2);
  headlightSpotLeft.position.set(bodyWidth * 0.36, 0.48, bodyLength * 0.5);
  const targetLeft = new THREE.Object3D();
  targetLeft.position.set(bodyWidth * 0.36, 0, bodyLength * 0.5 + 25);
  root.add(targetLeft);
  headlightSpotLeft.target = targetLeft;
  bodyGroup.add(headlightSpotLeft);

  const headlightSpotRight = new THREE.SpotLight(0xaae8ff, 60, 45, Math.PI / 6, 0.4, 1.2);
  headlightSpotRight.position.set(-bodyWidth * 0.36, 0.48, bodyLength * 0.5);
  const targetRight = new THREE.Object3D();
  targetRight.position.set(-bodyWidth * 0.36, 0, bodyLength * 0.5 + 25);
  root.add(targetRight);
  headlightSpotRight.target = targetRight;
  bodyGroup.add(headlightSpotRight);

  // Continuous Cyber Taillight Bar
  const taillights: THREE.Mesh[] = [];
  const tailGeo = new THREE.BoxGeometry(bodyWidth * 0.88, 0.07, 0.08);
  const tailMesh = new THREE.Mesh(tailGeo, taillightMat);
  tailMesh.position.set(0, 0.56, -bodyLength * 0.5 + 0.02);
  bodyGroup.add(tailMesh);
  taillights.push(tailMesh);

  const taillightPoint = new THREE.PointLight(0xff0022, 10, 8);
  taillightPoint.position.set(0, 0.56, -bodyLength * 0.5 - 0.5);
  bodyGroup.add(taillightPoint);

  // --- 5. QUAD EXHAUST TIPS ---
  const exhaustMeshes: THREE.Mesh[] = [];
  const exhaustGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.2, 16);
  exhaustGeo.rotateX(Math.PI / 2);

  const exhaustOffsets = [-0.45, -0.32, 0.32, 0.45];
  exhaustOffsets.forEach((xOff) => {
    const tip = new THREE.Mesh(exhaustGeo, chromeMat);
    tip.position.set(xOff, 0.24, -bodyLength * 0.5 - 0.1);
    bodyGroup.add(tip);
    exhaustMeshes.push(tip);
  });

  // --- 6. UNDERGLOW NEON PLANE ---
  const underglowGeo = new THREE.PlaneGeometry(bodyWidth * 1.05, bodyLength * 0.9);
  underglowGeo.rotateX(-Math.PI / 2);
  const underglowMesh = new THREE.Mesh(underglowGeo, underglowMat);
  underglowMesh.position.set(0, 0.08, 0);
  bodyGroup.add(underglowMesh);

  root.add(bodyGroup);

  // --- 7. WHEEL ASSEMBLIES ---
  function createWheel(): THREE.Group {
    const wheelGrp = new THREE.Group();

    // Tire
    const tireRadius = 0.36;
    const tireWidth = 0.28;
    const tireGeo = new THREE.CylinderGeometry(tireRadius, tireRadius, tireWidth, 24);
    tireGeo.rotateZ(Math.PI / 2);
    const tire = new THREE.Mesh(tireGeo, tireMat);
    tire.castShadow = true;
    wheelGrp.add(tire);

    // Rim Outer Lip & Center Hub
    const rimGeo = new THREE.CylinderGeometry(tireRadius * 0.72, tireRadius * 0.72, tireWidth * 1.02, 16);
    rimGeo.rotateZ(Math.PI / 2);
    const rim = new THREE.Mesh(rimGeo, chromeMat);
    wheelGrp.add(rim);

    // Brake Disc
    const discGeo = new THREE.CylinderGeometry(tireRadius * 0.58, tireRadius * 0.58, 0.03, 16);
    discGeo.rotateZ(Math.PI / 2);
    const discMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9, roughness: 0.2 });
    const disc = new THREE.Mesh(discGeo, discMat);
    wheelGrp.add(disc);

    // Caliper
    const caliperGeo = new THREE.BoxGeometry(0.08, 0.14, 0.1);
    const caliper = new THREE.Mesh(caliperGeo, brakeCaliperMat);
    caliper.position.set(0, tireRadius * 0.35, 0);
    wheelGrp.add(caliper);

    return wheelGrp;
  }

  const wheelOffsetZ = bodyLength * 0.33;
  const wheelOffsetX = bodyWidth * 0.54;
  const wheelY = 0.36;

  const wheelFrontLeft = createWheel();
  wheelFrontLeft.position.set(wheelOffsetX, wheelY, wheelOffsetZ);
  root.add(wheelFrontLeft);

  const wheelFrontRight = createWheel();
  wheelFrontRight.position.set(-wheelOffsetX, wheelY, wheelOffsetZ);
  wheelFrontRight.rotation.y = Math.PI;
  root.add(wheelFrontRight);

  const wheelRearLeft = createWheel();
  wheelRearLeft.position.set(wheelOffsetX, wheelY, -wheelOffsetZ);
  root.add(wheelRearLeft);

  const wheelRearRight = createWheel();
  wheelRearRight.position.set(-wheelOffsetX, wheelY, -wheelOffsetZ);
  wheelRearRight.rotation.y = Math.PI;
  root.add(wheelRearRight);

  return {
    root,
    bodyMesh: chassisMesh,
    wheelFrontLeft,
    wheelFrontRight,
    wheelRearLeft,
    wheelRearRight,
    headlights,
    taillights,
    headlightSpotLeft,
    headlightSpotRight,
    taillightPoint,
    underglowMesh,
    exhaustMeshes,
  };
}
