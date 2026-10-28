import React from 'react';
import { Play, Warehouse, Flag, Settings } from 'lucide-react';

interface TitleScreenProps {
  onStartFreeRoam: () => void;
  onOpenGarage: () => void;
  onOpenMissions: () => void;
  onOpenSettings: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartFreeRoam,
  onOpenGarage,
  onOpenMissions,
  onOpenSettings,
}) => {
  return (
    <div className="absolute inset-0 flex flex-col justify-between p-8 md:p-14 select-none pointer-events-none z-20">
      {/* Top Header / Spec Badge */}
      <div className="flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2 bg-[#060a12]/80 border border-cyan-500/30 px-3 py-1.5 rounded-md">
          <div className="w-2 h-2 rounded-full bg-cyan-400" />
          <span className="text-[11px] font-mono tracking-widest text-cyan-300 font-bold uppercase">
            CYBER ENGINE V3.4 // READY
          </span>
        </div>
        <div className="text-[11px] font-mono text-slate-400 tracking-wider">
          NEO-TOKYO OPEN WORLD
        </div>
      </div>

      {/* Center Bespoke SVG Title Lockup */}
      <div className="max-w-2xl my-auto">
        <div className="text-xs font-mono font-bold tracking-[0.35em] text-cyan-400 uppercase mb-2">
          ARCADE RACING SIMULATOR
        </div>

        {/* Bespoke SVG Title */}
        <div className="relative mb-4">
          <svg
            viewBox="0 0 600 120"
            className="w-full max-w-lg drop-shadow-[0_0_25px_rgba(0,240,255,0.4)]"
          >
            <defs>
              <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f0ff" />
                <stop offset="50%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#ff007f" />
              </linearGradient>
              <filter id="cyberGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Back Glow Layer */}
            <text
              x="10"
              y="90"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="86"
              fontWeight="900"
              letterSpacing="6"
              fill="none"
              stroke="#00f0ff"
              strokeWidth="4"
              opacity="0.4"
            >
              NEON DRIVE
            </text>

            {/* Main Fill Layer */}
            <text
              x="10"
              y="90"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="86"
              fontWeight="900"
              letterSpacing="6"
              fill="url(#neonGradient)"
              filter="url(#cyberGlow)"
            >
              NEON DRIVE
            </text>
          </svg>
        </div>

        <p className="text-sm md:text-base text-slate-300 max-w-md font-sans leading-relaxed mb-8 drop-shadow">
          Tear through high-gloss cyber avenues, drift rainy neon corridors, outrun highway traffic, and dominate underground challenges.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pointer-events-auto">
          {/* Primary Start CTA */}
          <button
            onClick={onStartFreeRoam}
            className="group relative px-7 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black text-sm tracking-wider uppercase rounded-lg shadow-[0_0_25px_rgba(0,240,255,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Play className="w-4 h-4 fill-black" />
            <span>ENTER CITY (DRIVE)</span>
          </button>

          {/* Garage */}
          <button
            onClick={onOpenGarage}
            className="px-5 py-3.5 bg-[#090e18]/90 hover:bg-slate-800/90 border border-cyan-500/40 text-cyan-300 font-bold text-sm tracking-wider uppercase rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Warehouse className="w-4 h-4 text-cyan-400" />
            <span>GARAGE</span>
          </button>

          {/* Missions */}
          <button
            onClick={onOpenMissions}
            className="px-5 py-3.5 bg-[#090e18]/90 hover:bg-slate-800/90 border border-yellow-500/40 text-yellow-300 font-bold text-sm tracking-wider uppercase rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Flag className="w-4 h-4 text-yellow-400" />
            <span>MISSIONS</span>
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="px-4 py-3.5 bg-[#090e18]/90 hover:bg-slate-800/90 border border-slate-700 text-slate-300 font-bold text-sm tracking-wider uppercase rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Flat Control-Hint Line */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-400 border-t border-slate-800/80 pt-4 pointer-events-auto">
        <div className="flex items-center gap-4">
          <span>WASD / ARROWS Drive</span>
          <span>·</span>
          <span>SPACE Handbrake / Drift</span>
          <span>·</span>
          <span>SHIFT Nitro Boost</span>
          <span>·</span>
          <span>C Camera Mode</span>
        </div>
        <div className="text-[10px] text-cyan-400/80 mt-2 sm:mt-0 font-bold">
          PRESS ENTER OR CLICK TO DRIVE
        </div>
      </div>
    </div>
  );
};
