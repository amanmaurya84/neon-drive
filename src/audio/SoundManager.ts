/**
 * Procedural Web Audio API Sound Synthesizer for NEON DRIVE
 * Zero external audio files (100% procedural, no 404s).
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private engineGain: GainNode | null = null;
  
  // Engine Oscillators
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineSub: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineDistortion: WaveShaperNode | null = null;
  private isEngineRunning: boolean = false;

  // Tire Screech
  private skidNoiseNode: AudioBufferSourceNode | null = null;
  private skidGain: GainNode | null = null;
  private skidFilter: BiquadFilterNode | null = null;

  // Nitro Sound
  private nitroGain: GainNode | null = null;
  private nitroNoise: AudioBufferSourceNode | null = null;

  // Ambient Synth Pad
  private ambientOsc: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;

  private isInitialized = false;

  public init() {
    if (this.isInitialized) return;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      this.engineGain.connect(this.masterGain);

      this.setupEngineSound();
      this.setupSkidSound();
      this.setupNitroSound();
      this.setupAmbientSound();

      this.isInitialized = true;
    } catch {
      // AudioContext not allowed or not supported
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private makeDistortionCurve(amount: number = 20): Float32Array {
    const k = typeof amount === 'number' ? amount : 20;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  private setupEngineSound() {
    if (!this.ctx || !this.engineGain) return;

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(280, this.ctx.currentTime);

    this.engineDistortion = this.ctx.createWaveShaper();
    this.engineDistortion.curve = this.makeDistortionCurve(15) as any;
    this.engineDistortion.oversample = '4x';

    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc1.type = 'sawtooth';
    this.engineOsc1.frequency.setValueAtTime(55, this.ctx.currentTime);

    this.engineOsc2 = this.ctx.createOscillator();
    this.engineOsc2.type = 'triangle';
    this.engineOsc2.frequency.setValueAtTime(110, this.ctx.currentTime);

    this.engineSub = this.ctx.createOscillator();
    this.engineSub.type = 'sine';
    this.engineSub.frequency.setValueAtTime(27.5, this.ctx.currentTime);

    this.engineOsc1.connect(this.engineDistortion);
    this.engineOsc2.connect(this.engineDistortion);
    this.engineSub.connect(this.engineDistortion);

    this.engineDistortion.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);

    this.engineOsc1.start();
    this.engineOsc2.start();
    this.engineSub.start();
    this.isEngineRunning = true;
  }

  private setupSkidSound() {
    if (!this.ctx || !this.sfxGain) return;

    // Generate white noise buffer
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.skidNoiseNode = this.ctx.createBufferSource();
    this.skidNoiseNode.buffer = noiseBuffer;
    this.skidNoiseNode.loop = true;

    this.skidFilter = this.ctx.createBiquadFilter();
    this.skidFilter.type = 'bandpass';
    this.skidFilter.frequency.setValueAtTime(1100, this.ctx.currentTime);
    this.skidFilter.Q.setValueAtTime(4, this.ctx.currentTime);

    this.skidGain = this.ctx.createGain();
    this.skidGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.skidNoiseNode.connect(this.skidFilter);
    this.skidFilter.connect(this.skidGain);
    this.skidGain.connect(this.sfxGain);

    this.skidNoiseNode.start();
  }

  private setupNitroSound() {
    if (!this.ctx || !this.sfxGain) return;

    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.nitroNoise = this.ctx.createBufferSource();
    this.nitroNoise.buffer = noiseBuffer;
    this.nitroNoise.loop = true;

    const nitroFilter = this.ctx.createBiquadFilter();
    nitroFilter.type = 'bandpass';
    nitroFilter.frequency.setValueAtTime(800, this.ctx.currentTime);
    nitroFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    this.nitroGain = this.ctx.createGain();
    this.nitroGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.nitroNoise.connect(nitroFilter);
    nitroFilter.connect(this.nitroGain);
    this.nitroGain.connect(this.sfxGain);

    this.nitroNoise.start();
  }

  private setupAmbientSound() {
    if (!this.ctx || !this.masterGain) return;

    this.ambientOsc = this.ctx.createOscillator();
    this.ambientOsc.type = 'sine';
    this.ambientOsc.frequency.setValueAtTime(65.4, this.ctx.currentTime); // C2

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

    this.ambientOsc.connect(this.ambientGain);
    this.ambientGain.connect(this.masterGain);
    this.ambientOsc.start();
  }

  /**
   * Update dynamic engine sound based on car RPM and throttle load
   */
  public updateEngine(rpm: number, maxRpm: number, throttle: number, isBraking: boolean) {
    if (!this.ctx || !this.isEngineRunning || this.isMuted) return;

    const rpmRatio = Math.max(0.1, Math.min(1.0, rpm / maxRpm));
    const baseFreq = 40 + rpmRatio * 180;

    const time = this.ctx.currentTime + 0.05;
    this.engineOsc1?.frequency.exponentialRampToValueAtTime(Math.max(20, baseFreq), time);
    this.engineOsc2?.frequency.exponentialRampToValueAtTime(Math.max(40, baseFreq * 1.5), time);
    this.engineSub?.frequency.exponentialRampToValueAtTime(Math.max(15, baseFreq * 0.5), time);

    // Filter opens up with throttle load
    const cutoff = 300 + rpmRatio * 1600 + (throttle > 0 ? 600 : 0);
    this.engineFilter?.frequency.linearRampToValueAtTime(cutoff, time);

    const targetGain = isBraking ? 0.15 : (0.2 + throttle * 0.25 + rpmRatio * 0.2);
    this.engineGain?.gain.linearRampToValueAtTime(targetGain, time);
  }

  /**
   * Adjust skid noise based on tire slip / drift intensity
   */
  public updateSkid(slipIntensity: number) {
    if (!this.ctx || !this.skidGain || this.isMuted) return;
    const clamped = Math.max(0, Math.min(1, slipIntensity));
    const targetGain = clamped > 0.15 ? (clamped - 0.15) * 0.6 : 0;
    this.skidGain.gain.linearRampToValueAtTime(targetGain, this.ctx.currentTime + 0.04);
  }

  /**
   * Set nitro hiss/roar intensity
   */
  public setNitro(active: boolean) {
    if (!this.ctx || !this.nitroGain || this.isMuted) return;
    const targetGain = active ? 0.45 : 0;
    this.nitroGain.gain.linearRampToValueAtTime(targetGain, this.ctx.currentTime + 0.05);

    if (active) {
      this.playTurboWhoosh();
    }
  }

  /**
   * Gear shift pop / turbo blow-off valve
   */
  public playGearShift() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playTurboWhoosh() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.35);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.36);
  }

  public playCollision(intensity: number) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const clamped = Math.min(1.0, Math.max(0.2, intensity));

    // Metallic crunch noise
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.25);

    gain.gain.setValueAtTime(0.4 * clamped, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.26);
  }

  public playCheckpoint() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const freqs = [587.33, 880, 1174.66]; // D5, A5, D6 cyber triad

    freqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0.25, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain || this.ctx.destination);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.32);
    });
  }

  public playCountdown(isGo: boolean = false) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const freq = isGo ? 987.77 : 493.88; // B5 for GO, B4 for 3,2,1
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isGo ? 0.6 : 0.2));

    osc.connect(gain);
    gain.connect(this.sfxGain || this.ctx.destination);

    osc.start(now);
    osc.stop(now + (isGo ? 0.62 : 0.22));
  }

  public playCashEarned() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(659.25, now);
    osc.frequency.exponentialRampToValueAtTime(987.77, now + 0.15);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.7, this.ctx.currentTime);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime);
    }
  }
}

export const soundManager = new SoundManager();
