import React from 'react';
import { Mission } from '../types/game';
import { Trophy, Timer, Flame, DollarSign, RotateCcw, ArrowRight, XCircle } from 'lucide-react';

interface RaceFinishModalProps {
  mission: Mission;
  success: boolean;
  reward: number;
  time: number;
  driftScore: number;
  onRetry: () => void;
  onContinue: () => void;
}

export const RaceFinishModal: React.FC<RaceFinishModalProps> = ({
  mission,
  success,
  reward,
  time,
  driftScore,
  onRetry,
  onContinue,
}) => {
  const formatTime = (t: number) => {
    const mins = Math.floor(t / 60);
    const secs = Math.floor(t % 60);
    const ms = Math.floor((t * 10) % 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}s`;
  };

  return (
    <div className="absolute inset-0 bg-[#04060acc] flex items-center justify-center p-4 z-40 select-none">
      <div
        className={`bg-[#090d16] border ${
          success ? 'border-yellow-400/50' : 'border-red-500/50'
        } rounded-xl w-full max-w-md p-6 shadow-2xl relative text-center flex flex-col items-center`}
      >
        {/* Result Icon */}
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${
            success
              ? 'bg-yellow-400/20 text-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.4)]'
              : 'bg-red-500/20 text-red-400 shadow-[0_0_25px_rgba(239,68,68,0.4)]'
          }`}
        >
          {success ? <Trophy className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
        </div>

        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider mb-1">
          {success ? 'MISSION COMPLETE' : 'TIME EXPIRED'}
        </h2>
        <div className="text-xs font-mono text-cyan-400 uppercase font-bold tracking-widest mb-6">
          {mission.title}
        </div>

        {/* Breakdown Stats */}
        <div className="w-full bg-[#0c101c] border border-slate-800 rounded-lg p-4 space-y-3 font-mono text-xs mb-6">
          <div className="flex justify-between items-center text-slate-300">
            <span className="flex items-center gap-1.5">
              <Timer className="w-4 h-4 text-cyan-400" />
              FINISH TIME
            </span>
            <span className="text-sm font-bold text-white tabular-nums">
              {formatTime(time)}
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-300">
            <span className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-pink-400" />
              DRIFT POINTS
            </span>
            <span className="text-sm font-bold text-pink-400 tabular-nums">
              +{driftScore.toLocaleString()} PTS
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-300 border-t border-slate-800/80 pt-2.5">
            <span className="flex items-center gap-1.5 text-yellow-400 font-bold">
              <DollarSign className="w-4 h-4" />
              CASH EARNED
            </span>
            <span className="text-base font-black text-yellow-400 tabular-nums">
              +${reward.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex items-center gap-3">
          <button
            onClick={onRetry}
            className="flex-1 py-3 bg-[#0f1422] hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold font-mono text-xs tracking-wider uppercase rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RETRY</span>
          </button>

          <button
            onClick={onContinue}
            className={`flex-1 py-3 font-black font-mono text-xs tracking-wider uppercase rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
              success
                ? 'bg-yellow-400 hover:bg-yellow-300 text-black shadow-[0_0_20px_rgba(250,204,21,0.4)]'
                : 'bg-cyan-500 hover:bg-cyan-400 text-black'
            }`}
          >
            <span>CONTINUE</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
