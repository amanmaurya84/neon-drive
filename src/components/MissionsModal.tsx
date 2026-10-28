import React from 'react';
import { Mission } from '../types/game';
import { X, Trophy, Timer, Flame, CheckCircle2, ChevronRight, Play } from 'lucide-react';

interface MissionsModalProps {
  missions: Mission[];
  onStartMission: (mission: Mission) => void;
  onClose: () => void;
}

export const MissionsModal: React.FC<MissionsModalProps> = ({
  missions,
  onStartMission,
  onClose,
}) => {
  return (
    <div className="absolute inset-0 bg-[#04060ab0] flex items-center justify-center p-4 z-30 select-none">
      <div className="bg-[#090d16] border border-yellow-500/40 rounded-xl w-full max-w-3xl p-6 shadow-2xl relative flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div>
            <span className="text-xs font-mono text-yellow-400 font-bold uppercase tracking-widest">
              COMPETITIVE RACING CHALLENGES
            </span>
            <h2 className="text-2xl font-black text-white tracking-wider flex items-center gap-2">
              NEON GRAND PRIX
            </h2>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Missions Cards */}
        <div className="space-y-3 flex-1">
          {missions.map((mission) => {
            const isSprint = mission.type === 'sprint';
            const isHighway = mission.type === 'highway';
            const isDrift = mission.type === 'drift';

            return (
              <div
                key={mission.id}
                className="bg-[#0b101c] border border-slate-800 hover:border-yellow-500/50 p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono px-2 py-0.5 rounded uppercase font-bold bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
                      {mission.type.toUpperCase()}
                    </span>
                    {mission.completed && (
                      <span className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        COMPLETED
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-white">{mission.title}</h3>
                  <p className="text-xs text-slate-400 font-sans mt-0.5 max-w-lg">
                    {mission.description}
                  </p>

                  {/* Conditions & Target */}
                  <div className="flex items-center gap-4 mt-2 text-xs font-mono text-slate-300">
                    {mission.timeLimit && (
                      <span className="flex items-center gap-1">
                        <Timer className="w-3.5 h-3.5 text-cyan-400" />
                        TIME LIMIT: {mission.timeLimit}s
                      </span>
                    )}
                    {isDrift && mission.targetDriftScore && (
                      <span className="flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-pink-400" />
                        TARGET SCORE: {mission.targetDriftScore.toLocaleString()}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-yellow-400 font-bold">
                      <Trophy className="w-3.5 h-3.5" />
                      REWARD: +${mission.reward.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Launch Button */}
                <button
                  onClick={() => onStartMission(mission)}
                  className="w-full sm:w-auto px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black font-black font-mono text-xs tracking-wider uppercase rounded-lg shadow-[0_0_15px_rgba(250,204,21,0.3)] transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 whitespace-nowrap"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>START RACE</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
