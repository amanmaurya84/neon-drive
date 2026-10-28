import React, { useState } from 'react';
import { CarStats } from '../types/game';
import { X, Check, Lock, DollarSign, Zap, Gauge, Compass } from 'lucide-react';
import { soundManager } from '../audio/SoundManager';

interface GarageModalProps {
  cars: CarStats[];
  activeCarId: string;
  cash: number;
  onSelectCar: (carId: string) => void;
  onUnlockCar: (carId: string) => void;
  onUpdateColors: (bodyColor: string, underglowColor: string, wheelColor: string) => void;
  onClose: () => void;
}

const COLOR_PALETTE = [
  { name: 'Cyber Cyan', hex: '#00f0ff' },
  { name: 'Neon Magenta', hex: '#ff007f' },
  { name: 'Electric Purple', hex: '#9333ea' },
  { name: 'Acid Green', hex: '#10b981' },
  { name: 'Sunset Amber', hex: '#ffaa00' },
  { name: 'Ghost White', hex: '#f8fafc' },
  { name: 'Stealth Black', hex: '#0f172a' },
];

const WHEEL_PALETTE = [
  { name: 'Chrome Silver', hex: '#cbd5e1' },
  { name: 'Matte Titanium', hex: '#475569' },
  { name: 'Cyber Blue', hex: '#38bdf8' },
  { name: 'Gold Anodized', hex: '#eab308' },
];

export const GarageModal: React.FC<GarageModalProps> = ({
  cars,
  activeCarId,
  cash,
  onSelectCar,
  onUnlockCar,
  onUpdateColors,
  onClose,
}) => {
  const [selectedCarIndex, setSelectedCarIndex] = useState(() =>
    Math.max(0, cars.findIndex((c) => c.id === activeCarId))
  );

  const car = cars[selectedCarIndex] || cars[0];

  const [bodyColor, setBodyColor] = useState(car.bodyColor);
  const [underglowColor, setUnderglowColor] = useState(car.underglowColor);
  const [wheelColor, setWheelColor] = useState(car.wheelColor);

  const handleColorChange = (newBody: string, newUnderglow: string, newWheel: string) => {
    setBodyColor(newBody);
    setUnderglowColor(newUnderglow);
    setWheelColor(newWheel);
    onUpdateColors(newBody, newUnderglow, newWheel);
  };

  const handleSwitchCar = (idx: number) => {
    setSelectedCarIndex(idx);
    const newCar = cars[idx];
    setBodyColor(newCar.bodyColor);
    setUnderglowColor(newCar.underglowColor);
    setWheelColor(newCar.wheelColor);
    if (newCar.unlocked) {
      onSelectCar(newCar.id);
    }
  };

  const handleBuy = () => {
    if (cash >= car.price && !car.unlocked) {
      soundManager.playCashEarned();
      onUnlockCar(car.id);
      onSelectCar(car.id);
    }
  };

  return (
    <div className="absolute inset-0 bg-[#04060ab0] flex items-center justify-center p-4 z-30 select-none">
      <div className="bg-[#090d16] border border-cyan-500/40 rounded-xl w-full max-w-4xl p-6 shadow-2xl relative flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div>
            <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-widest">
              CUSTOM TUNING & PERFORMANCE
            </span>
            <h2 className="text-2xl font-black text-white tracking-wider flex items-center gap-2">
              NEON SHOWROOM
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-[#0d1424] border border-cyan-500/30 px-3 py-1.5 rounded-md flex items-center gap-2">
              <span className="text-xs text-cyan-400 font-mono font-bold uppercase">BALANCE</span>
              <span className="text-base text-yellow-400 font-mono font-bold">
                ${cash.toLocaleString()}
              </span>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Car Selection Tabs */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {cars.map((c, idx) => {
            const isSelected = idx === selectedCarIndex;
            return (
              <button
                key={c.id}
                onClick={() => handleSwitchCar(idx)}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer relative ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                    : 'border-slate-800 bg-[#0c101c] hover:border-slate-700'
                }`}
              >
                {!c.unlocked && (
                  <div className="absolute top-2 right-2 text-yellow-400 bg-yellow-400/10 p-1 rounded">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                )}
                {c.id === activeCarId && c.unlocked && (
                  <div className="absolute top-2 right-2 text-cyan-400 bg-cyan-400/10 p-1 rounded">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
                <div className="text-xs font-mono text-slate-400 uppercase">{c.subtitle}</div>
                <div className="text-base font-bold text-white mt-0.5">{c.name}</div>
                <div className="text-xs font-mono text-cyan-400 mt-1">
                  {c.unlocked ? 'OWNED' : `$${c.price.toLocaleString()}`}
                </div>
              </button>
            );
          })}
        </div>

        {/* Car Details & Tuning Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
          {/* Left: Performance Specs */}
          <div className="bg-[#0b0f19] border border-slate-800 p-4 rounded-lg flex flex-col justify-between">
            <div>
              <div className="text-xl font-bold text-white">{car.name}</div>
              <p className="text-xs text-slate-400 mt-1 mb-4 leading-relaxed font-sans">
                {car.description}
              </p>

              {/* Specs Meters */}
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span className="flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                      TOP SPEED
                    </span>
                    <span className="font-bold text-white">{car.topSpeed} MPH</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 rounded-full"
                      style={{ width: `${(car.topSpeed / 240) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-yellow-400" />
                      ACCELERATION
                    </span>
                    <span className="font-bold text-white">{Math.round(car.acceleration * 100)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full"
                      style={{ width: `${car.acceleration * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span className="flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-pink-400" />
                      HANDLING & AGILITY
                    </span>
                    <span className="font-bold text-white">{Math.round(car.handling * 100)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-pink-400 rounded-full"
                      style={{ width: `${car.handling * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-purple-400" />
                      DRIFT FACTOR
                    </span>
                    <span className="font-bold text-white">{Math.round(car.driftFactor * 100)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-400 rounded-full"
                      style={{ width: `${car.driftFactor * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Selection or Buy Button */}
            <div className="mt-6 pt-4 border-t border-slate-800">
              {car.unlocked ? (
                <button
                  onClick={() => onSelectCar(car.id)}
                  disabled={car.id === activeCarId}
                  className={`w-full py-3 rounded-lg font-bold font-mono text-sm tracking-wider uppercase transition-all cursor-pointer ${
                    car.id === activeCarId
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 cursor-default'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                  }`}
                >
                  {car.id === activeCarId ? 'CURRENT VEHICLE' : 'SELECT & DRIVE'}
                </button>
              ) : (
                <button
                  onClick={handleBuy}
                  disabled={cash < car.price}
                  className={`w-full py-3 rounded-lg font-bold font-mono text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    cash >= car.price
                      ? 'bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black shadow-[0_0_20px_rgba(250,204,21,0.4)]'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <span>
                    UNLOCK FOR ${car.price.toLocaleString()}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Right: Custom Paint & Lighting Swatches */}
          <div className="bg-[#0b0f19] border border-slate-800 p-4 rounded-lg flex flex-col gap-4">
            <div className="text-sm font-mono text-cyan-400 font-bold uppercase tracking-wider">
              AESTHETIC FINISH
            </div>

            {/* Body Paint */}
            <div>
              <div className="text-xs font-mono text-slate-300 mb-2">METALLIC BODY PAINT</div>
              <div className="flex flex-wrap gap-2.5">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => handleColorChange(c.hex, underglowColor, wheelColor)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer ${
                      bodyColor === c.hex ? 'scale-115 border-white ring-2 ring-cyan-400' : 'border-slate-700 hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* Neon Underglow */}
            <div>
              <div className="text-xs font-mono text-slate-300 mb-2">NEON UNDERGLOW</div>
              <div className="flex flex-wrap gap-2.5">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={`underglow_${c.name}`}
                    onClick={() => handleColorChange(bodyColor, c.hex, wheelColor)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer ${
                      underglowColor === c.hex ? 'scale-115 border-white ring-2 ring-pink-400' : 'border-slate-700 hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* Wheel Rim Finish */}
            <div>
              <div className="text-xs font-mono text-slate-300 mb-2">ALLOY WHEEL RIM FINISH</div>
              <div className="flex flex-wrap gap-2.5">
                {WHEEL_PALETTE.map((w) => (
                  <button
                    key={`wheel_${w.name}`}
                    onClick={() => handleColorChange(bodyColor, underglowColor, w.hex)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer ${
                      wheelColor === w.hex ? 'scale-115 border-white ring-2 ring-yellow-400' : 'border-slate-700 hover:scale-105'
                    }`}
                    style={{ backgroundColor: w.hex }}
                    title={w.name}
                  />
                ))}
              </div>
            </div>

            <div className="mt-auto text-xs text-slate-400 font-sans border-t border-slate-800 pt-3">
              Paint finishes, neon tubes, and alloy rims update on your car in real-time.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
