import React from 'react';
import { GameSettings } from '../types/game';
import { X, Sliders, Monitor, Volume2, Gamepad2, CloudRain } from 'lucide-react';
import { soundManager } from '../audio/SoundManager';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  return (
    <div className="absolute inset-0 bg-[#04060ab0] flex items-center justify-center p-4 z-30 select-none">
      <div className="bg-[#090d16] border border-cyan-500/40 rounded-xl w-full max-w-xl p-6 shadow-2xl relative flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-black text-white tracking-wider">
              SYSTEM SETTINGS
            </h2>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Sections */}
        <div className="space-y-5 flex-1 font-mono text-xs">
          {/* Graphics Quality */}
          <div className="bg-[#0c101c] border border-slate-800 p-3.5 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-2 text-slate-200 font-bold uppercase">
                <Monitor className="w-4 h-4 text-cyan-400" />
                GRAPHICS PRESET
              </span>
              <span className="text-cyan-400 font-bold uppercase">{settings.graphicsQuality}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['high', 'medium', 'low'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => onUpdateSettings({ graphicsQuality: q })}
                  className={`py-2 rounded border uppercase font-bold transition-all cursor-pointer ${
                    settings.graphicsQuality === q
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
                      : 'border-slate-800 bg-[#090d16] text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Rain Weather */}
          <div className="bg-[#0c101c] border border-slate-800 p-3.5 rounded-lg flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-200 font-bold uppercase">
              <CloudRain className="w-4 h-4 text-cyan-400" />
              DYNAMIC RAIN WEATHER
            </span>
            <button
              onClick={() => onUpdateSettings({ rainEnabled: !settings.rainEnabled })}
              className={`px-4 py-1.5 rounded border uppercase font-bold transition-all cursor-pointer ${
                settings.rainEnabled
                  ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
                  : 'border-slate-800 bg-slate-900 text-slate-500'
              }`}
            >
              {settings.rainEnabled ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>

          {/* Audio Sound Volume */}
          <div className="bg-[#0c101c] border border-slate-800 p-3.5 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-2 text-slate-200 font-bold uppercase">
                <Volume2 className="w-4 h-4 text-cyan-400" />
                MASTER AUDIO VOLUME
              </span>
              <span className="text-cyan-400 font-bold">
                {Math.round(settings.soundVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.soundVolume}
              onChange={(e) => {
                const vol = parseFloat(e.target.value);
                onUpdateSettings({ soundVolume: vol });
                soundManager.setVolume(vol);
              }}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Virtual Touch Controls */}
          <div className="bg-[#0c101c] border border-slate-800 p-3.5 rounded-lg flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-200 font-bold uppercase">
              <Gamepad2 className="w-4 h-4 text-cyan-400" />
              ON-SCREEN MOBILE TOUCH CONTROLS
            </span>
            <button
              onClick={() => onUpdateSettings({ touchControls: !settings.touchControls })}
              className={`px-4 py-1.5 rounded border uppercase font-bold transition-all cursor-pointer ${
                settings.touchControls
                  ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
                  : 'border-slate-800 bg-slate-900 text-slate-500'
              }`}
            >
              {settings.touchControls ? 'ALWAYS ON' : 'AUTO / OFF'}
            </button>
          </div>

          {/* Controls Reference */}
          <div className="bg-[#0c101c] border border-slate-800 p-3.5 rounded-lg text-slate-400 space-y-1">
            <div className="text-cyan-300 font-bold uppercase mb-1">KEYBOARD COMMANDS</div>
            <div>W / ↑ — Accelerate</div>
            <div>S / ↓ — Brake / Reverse</div>
            <div>A / D / ← / → — Steer Left & Right</div>
            <div>Space — Handbrake / Initiate Drift</div>
            <div>Shift — Nitro Overdrive</div>
            <div>C — Switch Camera Angle (Chase / Hood / Orbit)</div>
            <div>R — Reset Car Upright</div>
            <div>M — Mute Sound Effects</div>
          </div>
        </div>
      </div>
    </div>
  );
};
