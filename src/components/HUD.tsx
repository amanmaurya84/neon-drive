import React, { useEffect, useRef } from 'react';
import { VehiclePhysicsState } from '../game/VehiclePhysics';
import { Mission, CameraViewMode } from '../types/game';
import { Volume2, VolumeX, Camera, RotateCcw, Pause } from 'lucide-react';
import { TrafficCar } from '../game/TrafficManager';

interface HUDProps {
  physicsState: VehiclePhysicsState;
  activeMission: Mission | null;
  countdown: number;
  isCountdownActive: boolean;
  missionTime: number;
  currentCheckpointIndex: number;
  cash: number;
  cameraMode: CameraViewMode;
  trafficCars: TrafficCar[];
  isMuted: boolean;
  onToggleMute: () => void;
  onCycleCamera: () => void;
  onResetCar: () => void;
  onPause: () => void;
  waypointAngle: number;
}

export const HUD: React.FC<HUDProps> = ({
  physicsState,
  activeMission,
  countdown,
  isCountdownActive,
  missionTime,
  currentCheckpointIndex,
  cash,
  cameraMode,
  trafficCars,
  isMuted,
  onToggleMute,
  onCycleCamera,
  onResetCar,
  onPause,
  waypointAngle,
}) => {
  const minimapCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Draw real-time radar minimap
  useEffect(() => {
    const canvas = minimapCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radarScale = 0.35; // units to pixels

    ctx.clearRect(0, 0, size, size);

    // Radar circular base
    ctx.fillStyle = 'rgba(8, 12, 20, 0.85)';
    ctx.beginPath();
    ctx.arc(center, center, center - 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Range rings
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.arc(center, center, center * 0.45, 0, Math.PI * 2);
    ctx.arc(center, center, center * 0.75, 0, Math.PI * 2);
    ctx.stroke();

    ctx.save();
    ctx.translate(center, center);
    // Rotate map so car forward is always UP
    ctx.rotate(-physicsState.heading);

    // Draw main city roads
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 6;
    const streets = [-180, -90, 0, 90, 180];
    streets.forEach((s) => {
      // North-South
      const rx = (s - physicsState.position.x) * radarScale;
      ctx.beginPath();
      ctx.moveTo(rx, -200);
      ctx.lineTo(rx, 200);
      ctx.stroke();

      // East-West
      const rz = (s - physicsState.position.z) * radarScale;
      ctx.beginPath();
      ctx.moveTo(-200, rz);
      ctx.lineTo(200, rz);
      ctx.stroke();
    });

    // Draw Highway
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
    ctx.lineWidth = 5;
    const hx = (-60 - physicsState.position.x) * radarScale;
    ctx.beginPath();
    ctx.moveTo(hx, -200);
    ctx.lineTo(hx, 200);
    ctx.stroke();

    // Draw Traffic Cars
    ctx.fillStyle = '#ff3366';
    trafficCars.forEach((tc) => {
      const tx = (tc.position.x - physicsState.position.x) * radarScale;
      const tz = (tc.position.z - physicsState.position.z) * radarScale;
      if (Math.hypot(tx, tz) < center - 6) {
        ctx.beginPath();
        ctx.arc(tx, tz, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw Active Mission Checkpoints
    if (activeMission && currentCheckpointIndex < activeMission.checkpoints.length) {
      const cp = activeMission.checkpoints[currentCheckpointIndex];
      const cx = (cp.x - physicsState.position.x) * radarScale;
      const cz = (cp.z - physicsState.position.z) * radarScale;
      if (Math.hypot(cx, cz) < center - 8) {
        ctx.fillStyle = '#ffbb00';
        ctx.beginPath();
        ctx.arc(cx, cz, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();

    // Player blip (fixed at center pointing UP)
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.moveTo(center, center - 6);
    ctx.lineTo(center + 4, center + 5);
    ctx.lineTo(center - 4, center + 5);
    ctx.closePath();
    ctx.fill();
  }, [physicsState.position, physicsState.heading, trafficCars, activeMission, currentCheckpointIndex]);

  // Format race timer mm:ss.ms
  const formatTimer = (t: number) => {
    const mins = Math.floor(t / 60);
    const secs = Math.floor(t % 60);
    const ms = Math.floor((t * 10) % 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const speed = physicsState.speedMph;
  const rpm = Math.round(physicsState.rpm);
  const rpmRatio = Math.min(1.0, rpm / 8000);

  return (
    <div className="absolute inset-0 pointer-events-none select-none text-white font-mono overflow-hidden">
      {/* --- TOP BAR (Credits, Navigation & Controls) --- */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-auto">
        {/* Cash Credits */}
        <div className="bg-[#0b0f19]/90 border border-cyan-500/30 px-3 py-1.5 rounded-md flex items-center gap-2 shadow-lg">
          <span className="text-xs text-cyan-400 font-bold uppercase tracking-wider">CASH</span>
          <span className="text-base text-yellow-400 font-bold tabular-nums">
            ${cash.toLocaleString()}
          </span>
        </div>

        {/* Waypoint Compass (when in mission) */}
        {activeMission && (
          <div className="bg-[#0b0f19]/90 border border-yellow-500/40 px-3 py-1.5 rounded-md flex items-center gap-2 shadow-lg">
            <span className="text-xs text-yellow-400 font-bold uppercase">WAYPOINT</span>
            <div
              className="w-4 h-4 text-yellow-300 font-bold transition-transform"
              style={{ transform: `rotate(${waypointAngle}rad)` }}
            >
              ▲
            </div>
          </div>
        )}

        {/* Quick Actions Cluster */}
        <div className="flex items-center gap-2">
          <button
            onClick={onCycleCamera}
            className="bg-[#0b0f19]/90 hover:bg-cyan-950/80 border border-cyan-500/30 p-2 rounded-md transition-colors"
            title="Cycle Camera (C)"
          >
            <Camera className="w-4 h-4 text-cyan-400" />
          </button>
          <button
            onClick={onResetCar}
            className="bg-[#0b0f19]/90 hover:bg-cyan-950/80 border border-cyan-500/30 p-2 rounded-md transition-colors"
            title="Reset Car (R)"
          >
            <RotateCcw className="w-4 h-4 text-cyan-400" />
          </button>
          <button
            onClick={onToggleMute}
            className="bg-[#0b0f19]/90 hover:bg-cyan-950/80 border border-cyan-500/30 p-2 rounded-md transition-colors"
            title="Mute Audio (M)"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-cyan-400" />
            )}
          </button>
          <button
            onClick={onPause}
            className="bg-[#0b0f19]/90 hover:bg-cyan-950/80 border border-cyan-500/30 p-2 rounded-md transition-colors"
            title="Pause Menu (Esc)"
          >
            <Pause className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </div>

      {/* --- RACE COUNTDOWN MODAL / BANNER --- */}
      {isCountdownActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center animate-bounce">
            <div className="text-7xl md:text-9xl font-black text-cyan-400 drop-shadow-[0_0_35px_#00f0ff] tracking-widest">
              {countdown > 1 ? Math.floor(countdown) : 'GO!'}
            </div>
            <div className="text-sm uppercase tracking-widest text-slate-300 mt-2 font-bold">
              GET READY TO BURN RUBBER
            </div>
          </div>
        </div>
      )}

      {/* --- DRIFT POPUP DISPLAY --- */}
      {physicsState.isDrifting && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 text-center pointer-events-none">
          <div className="text-xs uppercase tracking-widest text-pink-400 font-bold animate-pulse">
            DRIFT ANGLE
          </div>
          <div className="text-3xl md:text-4xl font-extrabold text-pink-400 drop-shadow-[0_0_20px_#ff007f] tabular-nums">
            +{physicsState.driftScore.toLocaleString()} PTS
          </div>
          <div className="text-xs font-bold text-yellow-400 bg-yellow-400/20 px-2 py-0.5 rounded-full inline-block mt-1">
            {physicsState.driftMultiplier.toFixed(1)}x MULTIPLIER
          </div>
        </div>
      )}

      {/* --- ACTIVE MISSION STATUS (TOP-LEFT) --- */}
      {activeMission && (
        <div className="absolute top-18 left-4 bg-[#0b0f19]/90 border border-cyan-500/30 p-3 rounded-md w-56 shadow-xl">
          <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider mb-0.5">
            {activeMission.title}
          </div>
          <div className="text-xl font-bold text-white tabular-nums">
            {formatTimer(missionTime)}
            {activeMission.timeLimit && (
              <span className="text-xs text-slate-400 ml-1">
                / {activeMission.timeLimit}s
              </span>
            )}
          </div>
          <div className="text-xs text-slate-300 mt-1 flex justify-between">
            <span>CHECKPOINT</span>
            <span className="font-bold text-yellow-400">
              {currentCheckpointIndex + 1} / {activeMission.checkpoints.length}
            </span>
          </div>
        </div>
      )}

      {/* --- BOTTOM-LEFT: RADAR MINIMAP & HEALTH --- */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-2">
        {/* Minimap */}
        <div className="relative">
          <canvas
            ref={minimapCanvasRef}
            width={120}
            height={120}
            className="rounded-full shadow-2xl border-2 border-cyan-500/40"
          />
          <div className="absolute -top-1 -right-1 bg-cyan-950/90 border border-cyan-500/40 text-[9px] px-1.5 py-0.5 rounded text-cyan-300 uppercase font-bold">
            RADAR
          </div>
        </div>

        {/* Car Health / Durability Bar */}
        <div className="bg-[#0b0f19]/90 border border-slate-700/60 p-2 rounded-md w-36 shadow-lg">
          <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold mb-1">
            <span>DURABILITY</span>
            <span className={physicsState.health < 30 ? 'text-red-400 font-black' : 'text-cyan-400'}>
              {physicsState.health}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-200 ${
                physicsState.health > 50
                  ? 'bg-cyan-400'
                  : physicsState.health > 25
                  ? 'bg-yellow-400'
                  : 'bg-red-500'
              }`}
              style={{ width: `${physicsState.health}%` }}
            />
          </div>
        </div>
      </div>

      {/* --- BOTTOM-RIGHT: DIGITAL SPEEDOMETER, TACHOMETER & NITRO GAUGE --- */}
      <div className="absolute bottom-4 right-4 flex items-end gap-3">
        {/* Nitro Tank Gauge */}
        <div className="bg-[#0b0f19]/90 border border-cyan-500/30 p-2 rounded-md flex flex-col items-center justify-between h-28 w-12 shadow-lg">
          <span className="text-[10px] font-bold text-cyan-400 uppercase">NITRO</span>
          <div className="w-3.5 flex-1 bg-slate-900 rounded-full overflow-hidden flex flex-col justify-end p-0.5 my-1">
            <div
              className={`w-full rounded-full transition-all ${
                physicsState.isNitroActive
                  ? 'bg-cyan-300 shadow-[0_0_10px_#00f0ff]'
                  : 'bg-cyan-500'
              }`}
              style={{ height: `${physicsState.nitro}%` }}
            />
          </div>
          <span className="text-[9px] font-bold tabular-nums text-slate-300">
            {Math.round(physicsState.nitro)}%
          </span>
        </div>

        {/* Speedometer & Tachometer Cluster */}
        <div className="bg-[#0b0f19]/90 border border-cyan-500/40 p-4 rounded-xl flex flex-col items-center shadow-2xl min-w-[140px]">
          {/* Gear Indicator */}
          <div className="flex items-center justify-between w-full mb-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold">GEAR</span>
            <span className="text-lg font-black text-yellow-400 px-2 py-0.5 rounded bg-yellow-400/10 border border-yellow-400/30">
              {physicsState.gear}
            </span>
          </div>

          {/* Big Digital Speed */}
          <div className="flex items-baseline gap-1 my-0.5">
            <span className="text-4xl md:text-5xl font-black text-white tabular-nums drop-shadow-[0_0_12px_#00f0ff]">
              {speed}
            </span>
            <span className="text-xs font-bold text-cyan-400">MPH</span>
          </div>

          {/* RPM Bar */}
          <div className="w-full mt-2">
            <div className="flex justify-between text-[9px] text-slate-400 mb-0.5">
              <span>RPM</span>
              <span className="tabular-nums font-bold text-slate-200">{rpm}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-100 ${
                  rpmRatio > 0.85 ? 'bg-red-500' : 'bg-cyan-400'
                }`}
                style={{ width: `${rpmRatio * 100}%` }}
              />
            </div>
          </div>

          {/* Mode Pill */}
          <div className="text-[9px] text-cyan-400/80 uppercase tracking-widest mt-2 border-t border-cyan-500/20 pt-1 w-full text-center">
            CAM: {cameraMode}
          </div>
        </div>
      </div>

      {/* --- BOTTOM-CENTER: HINT LINE --- */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-center pointer-events-none hidden md:block">
        <span className="text-[10px] text-slate-400 bg-[#080d17]/80 border border-slate-700/40 px-3 py-1 rounded-full uppercase tracking-wider">
          WASD / Arrows Drive · Space Handbrake · Shift Nitro · C Camera · R Reset
        </span>
      </div>
    </div>
  );
};
