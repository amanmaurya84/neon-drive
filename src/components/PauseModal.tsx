import React from 'react';
import { Play, RotateCcw, Flag, Warehouse, Settings, Home, X } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onResetCar: () => void;
  onOpenMissions: () => void;
  onOpenGarage: () => void;
  onOpenSettings: () => void;
  onQuitToTitle: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onResetCar,
  onOpenMissions,
  onOpenGarage,
  onOpenSettings,
  onQuitToTitle,
}) => {
  return (
    <div className="absolute inset-0 bg-[#04060acc] flex items-center justify-center p-4 z-40 select-none">
      <div className="bg-[#090d16] border border-cyan-500/40 rounded-xl w-full max-w-sm p-6 shadow-2xl relative text-center flex flex-col items-center">
        {/* Close Button */}
        <button
          onClick={onResume}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest mb-1">
          SIMULATION SUSPENDED
        </span>
        <h2 className="text-2xl font-black text-white tracking-wider mb-6">
          GAME PAUSED
        </h2>

        {/* Buttons List */}
        <div className="w-full space-y-2.5 font-mono text-xs">
          <button
            onClick={onResume}
            className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-wider rounded-lg shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Play className="w-4 h-4 fill-black" />
            <span>RESUME DRIVE</span>
          </button>

          <button
            onClick={onResetCar}
            className="w-full py-2.5 bg-[#0c101c] hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-cyan-400" />
            <span>RESET CAR UPRIGHT</span>
          </button>

          <button
            onClick={onOpenMissions}
            className="w-full py-2.5 bg-[#0c101c] hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Flag className="w-4 h-4 text-yellow-400" />
            <span>RACING MISSIONS</span>
          </button>

          <button
            onClick={onOpenGarage}
            className="w-full py-2.5 bg-[#0c101c] hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Warehouse className="w-4 h-4 text-cyan-400" />
            <span>GARAGE & TUNING</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="w-full py-2.5 bg-[#0c101c] hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>SETTINGS</span>
          </button>

          <button
            onClick={onQuitToTitle}
            className="w-full py-2.5 bg-[#0c101c] hover:bg-red-950/40 border border-red-500/30 text-red-300 font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer mt-4"
          >
            <Home className="w-4 h-4" />
            <span>TITLE SCREEN</span>
          </button>
        </div>
      </div>
    </div>
  );
};
