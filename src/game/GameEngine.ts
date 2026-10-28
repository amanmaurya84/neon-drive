import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildCarModel, CarMeshes } from './CarModelBuilder';
import { buildCyberCity, CityData } from './CityBuilder';
import { VehiclePhysics } from './VehiclePhysics';
import { TrafficManager } from './TrafficManager';
import { ParticleSystem } from './ParticleSystem';
import { MissionManager } from './MissionManager';
import { CameraViewMode, CarStats, GameSettings, PlayerControls } from '../types/game';
import { soundManager } from '../audio/SoundManager';

// Pre-allocated math helpers for zero GC in animation loop
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();

export class GameEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean = false;
  private frameId: number = 0;
  private clock: THREE.Clock;

  // Subsystems
  public vehiclePhysics: VehiclePhysics;
  public trafficManager: TrafficManager;
  public particleSystem: ParticleSystem;
  public missionManager: MissionManager;
  private cityData: CityData;
  private carMeshes: CarMeshes | null = null;

  // State
  public controls: PlayerControls = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    handbrake: false,
    nitro: false,
    reset: false,
    changeCamera: false,
  };

  public cameraMode: CameraViewMode = 'chase';
  private cameraShake: number = 0;
  public activeCarStats: CarStats;
  public settings: GameSettings;

  // Callbacks
  private onCashCollected?: (amount: number) => void;
  private onSpeedTrapTriggered?: (speed: number) => void;

  constructor(
    container: HTMLElement,
    initialCarStats: CarStats,
    settings: GameSettings,
    callbacks?: {
      onCashCollected?: (amount: number) => void;
      onSpeedTrapTriggered?: (speed: number) => void;
    }
  ) {
    this.container = container;
    this.activeCarStats = initialCarStats;
    this.settings = settings;
    this.onCashCollected = callbacks?.onCashCollected;
    this.onSpeedTrapTriggered = callbacks?.onSpeedTrapTriggered;

    this.clock = new THREE.Clock();

    // 1. Detect Software GL
    this.isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    // 2. Initialize WebGLRenderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl && this.settings.graphicsQuality !== 'low',
      powerPreference: 'high-performance',
      stencil: false,
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl && this.settings.graphicsQuality === 'high';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // 3. Scene & Camera Setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x04060a);
    this.scene.fog = new THREE.FogExp2(0x060810, 0.0075);

    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(this.settings.cameraFov || 65, aspect, 0.1, 1000);

    // 4. Procedural Room Environment (Zero external HDR files)
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Cinematic Lighting Rig
    this.setupLighting();

    // 6. Build Cyber City
    this.cityData = buildCyberCity(this.isSoftwareGl);
    this.scene.add(this.cityData.cityGroup);

    // 7. Initialize Vehicle Physics & 3D Car
    this.vehiclePhysics = new VehiclePhysics(this.activeCarStats, 0, 30);
    this.vehiclePhysics.setCollisionBoxes(this.cityData.collisionBoxes);

    this.rebuildCarMesh();

    // 8. Traffic Manager
    this.trafficManager = new TrafficManager();
    this.scene.add(this.trafficManager.trafficGroup);

    // 9. Particle System
    this.particleSystem = new ParticleSystem(this.settings.graphicsQuality === 'low');
    this.particleSystem.rainEnabled = this.settings.rainEnabled;
    this.scene.add(this.particleSystem.group);

    // 10. Mission Manager
    this.missionManager = new MissionManager();
    this.scene.add(this.missionManager.group);

    // 11. Event Listeners
    this.setupInputListeners();
    window.addEventListener('resize', this.onResize);

    // 12. Start Animation Loop
    this.startLoop();
  }

  private setupLighting() {
    // Hemisphere ambient sky/ground fill
    const hemiLight = new THREE.HemisphereLight(0x406090, 0x111520, 0.7);
    this.scene.add(hemiLight);

    // Directional Key Light (Moonlight / City Glow)
    const dirLight = new THREE.DirectionalLight(0x70aaff, 1.4);
    dirLight.position.set(60, 120, 60);
    dirLight.castShadow = !this.isSoftwareGl && this.settings.graphicsQuality === 'high';
    if (dirLight.castShadow) {
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
      dirLight.shadow.camera.near = 10;
      dirLight.shadow.camera.far = 300;
      const d = 90;
      dirLight.shadow.camera.left = -d;
      dirLight.shadow.camera.right = d;
      dirLight.shadow.camera.top = d;
      dirLight.shadow.camera.bottom = -d;
      dirLight.shadow.bias = -0.0005;
    }
    this.scene.add(dirLight);

    // Cyberpunk Accent Rim Lights
    const cyanLight = new THREE.PointLight(0x00f0ff, 15, 70);
    cyanLight.position.set(0, 15, 0);
    this.scene.add(cyanLight);

    const magentaLight = new THREE.PointLight(0xff007f, 15, 70);
    magentaLight.position.set(90, 15, 0);
    this.scene.add(magentaLight);
  }

  public rebuildCarMesh() {
    if (this.carMeshes) {
      this.scene.remove(this.carMeshes.root);
    }
    this.carMeshes = buildCarModel(
      this.activeCarStats.id,
      this.activeCarStats.bodyColor,
      this.activeCarStats.underglowColor,
      this.activeCarStats.wheelColor
    );
    this.scene.add(this.carMeshes.root);
    this.vehiclePhysics.setCarStats(this.activeCarStats);
  }

  public changeCar(newCarStats: CarStats) {
    this.activeCarStats = newCarStats;
    this.rebuildCarMesh();
  }

  public updateCarColors(bodyColor: string, underglowColor: string, wheelColor: string) {
    this.activeCarStats.bodyColor = bodyColor;
    this.activeCarStats.underglowColor = underglowColor;
    this.activeCarStats.wheelColor = wheelColor;
    this.rebuildCarMesh();
  }

  public cycleCamera() {
    if (this.cameraMode === 'chase') {
      this.cameraMode = 'hood';
    } else if (this.cameraMode === 'hood') {
      this.cameraMode = 'cinematic';
    } else {
      this.cameraMode = 'chase';
    }
  }

  private setupInputListeners() {
    const onKeyDown = (e: KeyboardEvent) => {
      soundManager.resume();

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.controls.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.controls.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.controls.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.controls.right = true;
          break;
        case 'Space':
          this.controls.handbrake = true;
          e.preventDefault();
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.controls.nitro = true;
          break;
        case 'KeyC':
          this.cycleCamera();
          break;
        case 'KeyR':
          this.vehiclePhysics.reset(0, 30, 0);
          break;
        case 'KeyM':
          soundManager.setMuted(!soundManager.getMuted());
          break;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.controls.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.controls.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.controls.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.controls.right = false;
          break;
        case 'Space':
          this.controls.handbrake = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.controls.nitro = false;
          break;
      }
    };

    const onBlur = () => {
      this.controls.forward = false;
      this.controls.backward = false;
      this.controls.left = false;
      this.controls.right = false;
      this.controls.handbrake = false;
      this.controls.nitro = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
  }

  private onResize = () => {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private startLoop() {
    let tickCount = 0;

    const tick = () => {
      const rawDt = this.clock.getDelta();
      const dt = Math.min(rawDt, 0.05);
      tickCount++;

      // 1. Update Vehicle Physics
      this.vehiclePhysics.update(dt, this.controls);
      const vp = this.vehiclePhysics.state;

      // 2. Sync 3D Car Model with Physics
      if (this.carMeshes) {
        this.carMeshes.root.position.copy(vp.position);
        this.carMeshes.root.rotation.set(vp.pitch, vp.heading, vp.roll);

        // Front wheel steering
        this.carMeshes.wheelFrontLeft.rotation.y = vp.steeringAngle;
        this.carMeshes.wheelFrontRight.rotation.y = Math.PI + vp.steeringAngle;

        // Wheel rolling based on distance traveled
        const wheelRotSpeed = (vp.speedMph * 0.44704 * dt) / 0.36;
        this.carMeshes.wheelFrontLeft.children[0]?.rotateZ(wheelRotSpeed);
        this.carMeshes.wheelFrontRight.children[0]?.rotateZ(wheelRotSpeed);
        this.carMeshes.wheelRearLeft.children[0]?.rotateZ(wheelRotSpeed);
        this.carMeshes.wheelRearRight.children[0]?.rotateZ(wheelRotSpeed);

        // Brake lights brighten when braking
        const isBraking = this.controls.backward || this.controls.handbrake;
        this.carMeshes.taillightPoint.intensity = isBraking ? 25 : 8;
        if (this.carMeshes.taillights[0]?.material instanceof THREE.MeshStandardMaterial) {
          this.carMeshes.taillights[0].material.emissiveIntensity = isBraking ? 6.0 : 2.5;
        }

        // Particle emissions
        if (vp.isDrifting) {
          // Smoke from rear wheels
          const rL = this.carMeshes.wheelRearLeft.getWorldPosition(_vec3A);
          const rR = this.carMeshes.wheelRearRight.getWorldPosition(_vec3B);
          this.particleSystem.emitSmoke(rL.x, rL.y, rL.z, 2);
          this.particleSystem.emitSmoke(rR.x, rR.y, rR.z, 2);
        }

        if (vp.isNitroActive) {
          const exhaustWorld = this.carMeshes.exhaustMeshes[0]?.getWorldPosition(_vec3A);
          if (exhaustWorld) {
            this.particleSystem.emitNitroFlames(exhaustWorld.x, exhaustWorld.y, exhaustWorld.z, vp.heading, 3);
          }
        }

        if (vp.lastCollisionImpact > 0.1) {
          this.cameraShake = vp.lastCollisionImpact * 0.4;
          this.particleSystem.emitSparks(vp.position.x, vp.position.y + 0.4, vp.position.z, 18);
        }
      }

      // 3. Update Traffic
      this.trafficManager.update(dt, vp.position);

      // Check collision between traffic and player
      if (this.trafficManager.checkPlayerCollision(vp.position, this.vehiclePhysics.halfWidth, this.vehiclePhysics.halfLength)) {
        this.vehiclePhysics.reset(vp.position.x - Math.sin(vp.heading) * 3, vp.position.z - Math.cos(vp.heading) * 3, vp.heading);
        soundManager.playCollision(0.8);
        this.cameraShake = 0.5;
        this.particleSystem.emitSparks(vp.position.x, vp.position.y + 0.5, vp.position.z, 20);
      }

      // 4. Update Particle Systems
      this.particleSystem.update(dt, vp.position);

      // 5. Update Collectibles & Plaza Ring
      this.cityData.animatedPlazaRing.rotation.y += dt * 0.8;
      this.cityData.animatedPlazaRing.rotation.x += dt * 0.3;

      for (let i = 0; i < this.cityData.collectibles.length; i++) {
        const token = this.cityData.collectibles[i];
        if (!token.collected) {
          token.mesh.rotation.y += dt * 2.5;
          token.mesh.position.y = token.y + Math.sin(tickCount * 0.05 + i) * 0.25;

          // Check pickup
          if (vp.position.distanceTo(token.mesh.position) < 3.2) {
            token.collected = true;
            token.mesh.visible = false;
            soundManager.playCashEarned();
            this.onCashCollected?.(token.value);
            this.particleSystem.emitSparks(token.x, token.y, token.z, 16);
          }
        }
      }

      // 6. Update Camera View
      this.updateCamera(dt, vp);

      // 7. Render Scene
      this.renderer.render(this.scene, this.camera);

      this.frameId = requestAnimationFrame(tick);
    };

    this.frameId = requestAnimationFrame(tick);
  }

  private updateCamera(dt: number, vp: { position: THREE.Vector3; heading: number; speedMph: number; isNitroActive: boolean }) {
    // Dynamic camera shake decay
    if (this.cameraShake > 0) {
      this.cameraShake = Math.max(0, this.cameraShake - dt * 1.5);
    }
    const shakeX = (Math.random() - 0.5) * this.cameraShake;
    const shakeY = (Math.random() - 0.5) * this.cameraShake;

    if (this.cameraMode === 'chase') {
      // Speed-dependent pull back
      const speedFactor = Math.min(1.0, vp.speedMph / 140);
      const distance = 6.2 + speedFactor * 1.8 + (vp.isNitroActive ? 1.0 : 0);
      const height = 2.4 + speedFactor * 0.4;

      const targetX = vp.position.x - Math.sin(vp.heading) * distance + shakeX;
      const targetZ = vp.position.z - Math.cos(vp.heading) * distance + shakeX;
      const targetY = vp.position.y + height + shakeY;

      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, targetX, 10, dt);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, targetY, 10, dt);
      this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, targetZ, 10, dt);

      const lookAhead = vp.position.clone().add(
        new THREE.Vector3(Math.sin(vp.heading) * 8, 1.2, Math.cos(vp.heading) * 8)
      );
      this.camera.lookAt(lookAhead);

      // Nitro FOV kick
      const targetFov = this.settings.cameraFov + (vp.isNitroActive ? 12 : speedFactor * 5);
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 8, dt);
      this.camera.updateProjectionMatrix();
    } else if (this.cameraMode === 'hood') {
      // Hood camera right above hood
      const hoodOffset = new THREE.Vector3(
        Math.sin(vp.heading) * 0.6,
        1.1,
        Math.cos(vp.heading) * 0.6
      );
      this.camera.position.copy(vp.position).add(hoodOffset);
      this.camera.position.x += shakeX;
      this.camera.position.y += shakeY;

      const lookTarget = vp.position.clone().add(
        new THREE.Vector3(Math.sin(vp.heading) * 30, 0.8, Math.cos(vp.heading) * 30)
      );
      this.camera.lookAt(lookTarget);
    } else {
      // Cinematic slow orbit
      const time = this.clock.getElapsedTime() * 0.4;
      const orbitDist = 9.0;
      this.camera.position.x = vp.position.x + Math.sin(time) * orbitDist;
      this.camera.position.z = vp.position.z + Math.cos(time) * orbitDist;
      this.camera.position.y = vp.position.y + 3.2;
      this.camera.lookAt(vp.position.x, vp.position.y + 1.0, vp.position.z);
    }
  }

  public dispose() {
    cancelAnimationFrame(this.frameId);
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
