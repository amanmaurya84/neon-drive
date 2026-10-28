export type GameState = 'title' | 'playing' | 'paused' | 'garage' | 'missions' | 'settings' | 'gameover' | 'victory';

export type CameraViewMode = 'chase' | 'hood' | 'cinematic';

export interface CarStats {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  unlocked: boolean;
  topSpeed: number; // in mph
  acceleration: number; // 0 to 1 scale
  handling: number; // 0 to 1 scale
  driftFactor: number;
  bodyColor: string;
  underglowColor: string;
  wheelColor: string;
  description: string;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  type: 'sprint' | 'highway' | 'drift' | 'timeattack';
  reward: number;
  timeLimit?: number;
  targetDriftScore?: number;
  checkpoints: { x: number; z: number; radius: number }[];
  completed: boolean;
  bestTime?: number;
  bestScore?: number;
}

export interface PlayerControls {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  handbrake: boolean;
  nitro: boolean;
  reset: boolean;
  changeCamera: boolean;
}

export interface GameSettings {
  graphicsQuality: 'high' | 'medium' | 'low';
  rainEnabled: boolean;
  soundVolume: number; // 0 to 1
  sfxVolume: number;
  musicVolume: number;
  cameraFov: number;
  touchControls: boolean;
}

export interface PlayerProgress {
  cash: number;
  carsOwned: string[];
  activeCarId: string;
  completedMissions: string[];
  totalDriftScore: number;
  totalDistanceKm: number;
}
