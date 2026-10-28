import React from 'react';
import { PlayerControls } from '../types/game';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Zap, ShieldAlert } from 'lucide-react';
import { soundManager } from '../audio/SoundManager';

interface MobileControlsProps {
  controls: PlayerControls;
}

export const MobileControls: React.FC<MobileControlsProps> = ({ controls }) => {
  const handleTouchStart = (key: keyof PlayerControls, e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    soundManager.resume();
    controls[key] = true;
  };

  const handleTouchEnd = (key: keyof PlayerControls, e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    controls[key] = false;
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 flex justify-between items-end p-4 pb-6">
      {/* --- LEFT CLUSTER: STEERING (LEFT / RIGHT) --- */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <button
          onTouchStart={(e) => handleTouchStart('left', e)}
          onTouchEnd={(e) => handleTouchEnd('left', e)}
          onMouseDown={(e) => handleTouchStart('left', e)}
          onMouseUp={(e) => handleTouchEnd('left', e)}
          className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all cursor-pointer ${
            controls.left
              ? 'bg-cyan-500/40 border-cyan-300 scale-95 shadow-[0_0_15px_#00f0ff]'
              : 'bg-[#080d18]/80 border-cyan-500/40 active:scale-95'
          }`}
          title="Steer Left"
        >
          <ArrowLeft className="w-8 h-8 text-cyan-300" />
        </button>

        <button
          onTouchStart={(e) => handleTouchStart('right', e)}
          onTouchEnd={(e) => handleTouchEnd('right', e)}
          onMouseDown={(e) => handleTouchStart('right', e)}
          onMouseUp={(e) => handleTouchEnd('right', e)}
          className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all cursor-pointer ${
            controls.right
              ? 'bg-cyan-500/40 border-cyan-300 scale-95 shadow-[0_0_15px_#00f0ff]'
              : 'bg-[#080d18]/80 border-cyan-500/40 active:scale-95'
          }`}
          title="Steer Right"
        >
          <ArrowRight className="w-8 h-8 text-cyan-300" />
        </button>
      </div>

      {/* --- RIGHT CLUSTER: ACCEL, BRAKE, DRIFT, NITRO --- */}
      <div className="flex items-end gap-3 pointer-events-auto">
        {/* Handbrake / Drift Button */}
        <button
          onTouchStart={(e) => handleTouchStart('handbrake', e)}
          onTouchEnd={(e) => handleTouchEnd('handbrake', e)}
          onMouseDown={(e) => handleTouchStart('handbrake', e)}
          onMouseUp={(e) => handleTouchEnd('handbrake', e)}
          className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center border-2 transition-all cursor-pointer ${
            controls.handbrake
              ? 'bg-pink-500/50 border-pink-300 scale-95 shadow-[0_0_15px_#ff007f]'
              : 'bg-[#080d18]/80 border-pink-500/40 active:scale-95'
          }`}
          title="Handbrake Drift"
        >
          <ShieldAlert className="w-5 h-5 text-pink-400 mb-0.5" />
          <span className="text-[9px] font-mono font-bold text-pink-300">DRIFT</span>
        </button>

        {/* Nitro Overdrive Button */}
        <button
          onTouchStart={(e) => handleTouchStart('nitro', e)}
          onTouchEnd={(e) => handleTouchEnd('nitro', e)}
          onMouseDown={(e) => handleTouchStart('nitro', e)}
          onMouseUp={(e) => handleTouchEnd('nitro', e)}
          className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center border-2 transition-all cursor-pointer ${
            controls.nitro
              ? 'bg-cyan-400 border-white scale-95 shadow-[0_0_20px_#00f0ff]'
              : 'bg-[#080d18]/80 border-cyan-400 active:scale-95'
          }`}
          title="Nitro Boost"
        >
          <Zap className="w-6 h-6 text-cyan-300 mb-0.5" />
          <span className="text-[9px] font-mono font-bold text-cyan-200">NITRO</span>
        </button>

        {/* Brake / Reverse Pedal */}
        <button
          onTouchStart={(e) => handleTouchStart('backward', e)}
          onTouchEnd={(e) => handleTouchEnd('backward', e)}
          onMouseDown={(e) => handleTouchStart('backward', e)}
          onMouseUp={(e) => handleTouchEnd('backward', e)}
          className={`w-16 h-20 rounded-2xl flex flex-col items-center justify-center border-2 transition-all cursor-pointer ${
            controls.backward
              ? 'bg-red-500/40 border-red-300 scale-95 shadow-[0_0_15px_#ef4444]'
              : 'bg-[#080d18]/80 border-red-500/40 active:scale-95'
          }`}
          title="Brake / Reverse"
        >
          <ArrowDown className="w-7 h-7 text-red-400" />
          <span className="text-[10px] font-mono font-bold text-red-300 mt-1">BRAKE</span>
        </button>

        {/* Gas / Accelerate Pedal */}
        <button
          onTouchStart={(e) => handleTouchStart('forward', e)}
          onTouchEnd={(e) => handleTouchEnd('forward', e)}
          onMouseDown={(e) => handleTouchStart('forward', e)}
          onMouseUp={(e) => handleTouchEnd('forward', e)}
          className={`w-18 h-24 rounded-2xl flex flex-col items-center justify-center border-2 transition-all cursor-pointer ${
            controls.forward
              ? 'bg-emerald-500/50 border-emerald-300 scale-95 shadow-[0_0_20px_#10b981]'
              : 'bg-[#080d18]/80 border-emerald-500/40 active:scale-95'
          }`}
          title="Accelerate"
        >
          <ArrowUp className="w-8 h-8 text-emerald-400" />
          <span className="text-[11px] font-mono font-black text-emerald-300 mt-1">GAS</span>
        </button>
      </div>
    </div>
  );
};
