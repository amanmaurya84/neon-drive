/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/GameEngine';
import { TitleScreen } from './components/TitleScreen';
import { HUD } from './components/HUD';
import { GarageModal } from './components/GarageModal';
import { MissionsModal } from './components/MissionsModal';
import { SettingsModal } from './components/SettingsModal';
import { PauseModal } from './components/PauseModal';
import { RaceFinishModal } from './components/RaceFinishModal';
import { MobileControls } from './components/MobileControls';
import { INITIAL_CARS } from './data/cars';
import { MISSIONS_DATA } from './game/MissionManager';
import {
  GameState,
  CarStats,
  Mission,
  GameSettings,
  CameraViewMode,
} from './types/game';
import { soundManager } from './audio/SoundManager';

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Game Lifecycle State
  const [gameState, setGameState] = useState<GameState>('title');
  const [cash, setCash] = useState<number>(1500);
  const [cars, setCars] = useState<CarStats[]>(INITIAL_CARS);
  const [activeCarId, setActiveCarId] = useState<string>('specter');
  const [missions, setMissions] = useState<Mission[]>(MISSIONS_DATA);
  const [activeMission, setActiveMission] = useState<Mission | null>(null);

  // Race Results State
  const [raceResult, setRaceResult] = useState<{
    mission: Mission;
    success: boolean;
    reward: number;
    time: number;
    driftScore: number;
  } | null>(null);

  // Settings State
  const [settings, setSettings] = useState<GameSettings>({
    graphicsQuality: 'high',
    rainEnabled: true,
    soundVolume: 0.8,
    sfxVolume: 0.8,
    musicVolume: 0.5,
    cameraFov: 65,
    touchControls: false,
  });

  const [isMuted, setIsMuted] = useState(false);
  const [cameraMode, setCameraMode] = useState<CameraViewMode>('chase');

  // Fast-sampled HUD physics snapshot
  const [hudPhysics, setHudPhysics] = useState(() => ({
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
    gear: 1 as number | string,
    health: 100,
    lastCollisionImpact: 0,
    steerInput: 0,
    position: { x: 0, y: 0.36, z: 30 } as any,
  }));

  const [missionTime, setMissionTime] = useState<number>(0);
  const [currentCpIndex, setCurrentCpIndex] = useState<number>(0);
  const [countdown, setCountdown] = useState<number>(0);
  const [isCountdownActive, setIsCountdownActive] = useState<boolean>(false);
  const [waypointAngle, setWaypointAngle] = useState<number>(0);

  // Detect mobile touchscreen
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // 1. Initialize 3D GameEngine once on mount
  useEffect(() => {
    if (!mountRef.current) return;

    soundManager.init();

    const activeCar = cars.find((c) => c.id === activeCarId) || cars[0];

    const engine = new GameEngine(mountRef.current, activeCar, settings, {
      onCashCollected: (amount) => {
        setCash((prev) => prev + amount);
      },
    });

    engineRef.current = engine;

    // HUD Polling Loop (isolated from React render cycle)
    const interval = setInterval(() => {
      if (!engineRef.current) return;
      const vp = engineRef.current.vehiclePhysics.state;
      const mm = engineRef.current.missionManager;

      setHudPhysics({
        ...vp,
        position: vp.position.clone(),
      });

      setCameraMode(engineRef.current.cameraMode);
      setCountdown(mm.countdown);
      setIsCountdownActive(mm.isCountdownActive);
      setMissionTime(mm.elapsedTime);
      setCurrentCpIndex(mm.currentCheckpointIndex);

      if (mm.activeMission) {
        setWaypointAngle(mm.getNextCheckpointDirection(vp.position, vp.heading));
      }
    }, 50); // 20 updates/sec is super smooth for numbers while saving CPU

    return () => {
      clearInterval(interval);
      engine.dispose();
      engineRef.current = null;
    };
  }, []); // Run once!

  // Update sound mute status
  const handleToggleMute = useCallback(() => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    soundManager.setMuted(nextMute);
  }, [isMuted]);

  // Cycle camera
  const handleCycleCamera = useCallback(() => {
    engineRef.current?.cycleCamera();
    if (engineRef.current) {
      setCameraMode(engineRef.current.cameraMode);
    }
  }, []);

  // Reset car upright
  const handleResetCar = useCallback(() => {
    engineRef.current?.vehiclePhysics.reset(0, 30, 0);
  }, []);

  // Select Car in Garage
  const handleSelectCar = (carId: string) => {
    setActiveCarId(carId);
    const selected = cars.find((c) => c.id === carId);
    if (selected && engineRef.current) {
      engineRef.current.changeCar(selected);
    }
  };

  // Unlock Car
  const handleUnlockCar = (carId: string) => {
    const target = cars.find((c) => c.id === carId);
    if (!target || cash < target.price) return;

    setCash((prev) => prev - target.price);
    setCars((prev) =>
      prev.map((c) => (c.id === carId ? { ...c, unlocked: true } : c))
    );
  };

  // Custom Paint Updates
  const handleUpdateColors = (bodyColor: string, underglowColor: string, wheelColor: string) => {
    setCars((prev) =>
      prev.map((c) =>
        c.id === activeCarId
          ? { ...c, bodyColor, underglowColor, wheelColor }
          : c
      )
    );
    engineRef.current?.updateCarColors(bodyColor, underglowColor, wheelColor);
  };

  // Start Free Roam
  const handleStartFreeRoam = () => {
    soundManager.resume();
    engineRef.current?.missionManager.cancelMission();
    setActiveMission(null);
    setGameState('playing');
  };

  // Start Mission
  const handleStartMission = (mission: Mission) => {
    soundManager.resume();
    setActiveMission(mission);
    setGameState('playing');

    if (engineRef.current) {
      // Teleport car to first checkpoint or mission start line
      const firstCp = mission.checkpoints[0];
      const heading = mission.type === 'highway' ? Math.PI : 0;
      engineRef.current.vehiclePhysics.reset(firstCp.x, firstCp.z - 25, heading);
      engineRef.current.missionManager.startMission(mission);
    }
  };

  // Check mission status on each frame tick
  useEffect(() => {
    if (!engineRef.current || gameState !== 'playing') return;

    const interval = setInterval(() => {
      const mm = engineRef.current?.missionManager;
      const vp = engineRef.current?.vehiclePhysics.state;
      if (!mm || !vp) return;

      mm.update(0.05, vp.position, vp.driftScore, (mission, success, reward, time) => {
        if (success) {
          setCash((prev) => prev + reward);
          setMissions((prev) =>
            prev.map((m) => (m.id === mission.id ? { ...m, completed: true } : m))
          );
        }

        setRaceResult({
          mission,
          success,
          reward: success ? reward : 0,
          time,
          driftScore: vp.driftScore,
        });

        setActiveMission(null);
        setGameState('victory');
      });
    }, 50);

    return () => clearInterval(interval);
  }, [gameState]);

  // Global Keyboard shortcuts for menus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === 'title') {
        if (e.code === 'Enter' || e.code === 'Space') {
          handleStartFreeRoam();
        }
      } else if (gameState === 'playing') {
        if (e.code === 'Escape' || e.code === 'KeyP') {
          setGameState('paused');
        }
      } else if (gameState === 'paused') {
        if (e.code === 'Escape' || e.code === 'KeyP') {
          setGameState('playing');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none font-sans">
      {/* 3D WebGL Canvas Container */}
      <div
        ref={mountRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* --- TITLE SCREEN --- */}
      {gameState === 'title' && (
        <TitleScreen
          onStartFreeRoam={handleStartFreeRoam}
          onOpenGarage={() => setGameState('garage')}
          onOpenMissions={() => setGameState('missions')}
          onOpenSettings={() => setGameState('settings')}
        />
      )}

      {/* --- PLAYING HUD --- */}
      {gameState === 'playing' && (
        <>
          <HUD
            physicsState={hudPhysics as any}
            activeMission={activeMission}
            countdown={countdown}
            isCountdownActive={isCountdownActive}
            missionTime={missionTime}
            currentCheckpointIndex={currentCpIndex}
            cash={cash}
            cameraMode={cameraMode}
            trafficCars={engineRef.current?.trafficManager.cars || []}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onCycleCamera={handleCycleCamera}
            onResetCar={handleResetCar}
            onPause={() => setGameState('paused')}
            waypointAngle={waypointAngle}
          />

          {/* Virtual Mobile Controls (if enabled or touch detected) */}
          {(settings.touchControls || isTouchDevice) && engineRef.current && (
            <MobileControls controls={engineRef.current.controls} />
          )}
        </>
      )}

      {/* --- GARAGE MODAL --- */}
      {gameState === 'garage' && (
        <GarageModal
          cars={cars}
          activeCarId={activeCarId}
          cash={cash}
          onSelectCar={handleSelectCar}
          onUnlockCar={handleUnlockCar}
          onUpdateColors={handleUpdateColors}
          onClose={() => setGameState('title')}
        />
      )}

      {/* --- MISSIONS MODAL --- */}
      {gameState === 'missions' && (
        <MissionsModal
          missions={missions}
          onStartMission={handleStartMission}
          onClose={() => setGameState('title')}
        />
      )}

      {/* --- SETTINGS MODAL --- */}
      {gameState === 'settings' && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={(newS) => {
            setSettings((prev) => ({ ...prev, ...newS }));
            if (engineRef.current && newS.rainEnabled !== undefined) {
              engineRef.current.particleSystem.rainEnabled = newS.rainEnabled;
            }
          }}
          onClose={() => setGameState('title')}
        />
      )}

      {/* --- PAUSE MODAL --- */}
      {gameState === 'paused' && (
        <PauseModal
          onResume={() => setGameState('playing')}
          onResetCar={() => {
            handleResetCar();
            setGameState('playing');
          }}
          onOpenMissions={() => setGameState('missions')}
          onOpenGarage={() => setGameState('garage')}
          onOpenSettings={() => setGameState('settings')}
          onQuitToTitle={() => {
            engineRef.current?.missionManager.cancelMission();
            setActiveMission(null);
            setGameState('title');
          }}
        />
      )}

      {/* --- RACE VICTORY / FINISH MODAL --- */}
      {gameState === 'victory' && raceResult && (
        <RaceFinishModal
          mission={raceResult.mission}
          success={raceResult.success}
          reward={raceResult.reward}
          time={raceResult.time}
          driftScore={raceResult.driftScore}
          onRetry={() => {
            setGameState('playing');
            handleStartMission(raceResult.mission);
          }}
          onContinue={() => {
            setGameState('playing');
          }}
        />
      )}
    </div>
  );
}
