import { haptics } from './haptics';

class SoundEffectsEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = localStorage.getItem('aryabhatta_sfx_muted') === 'true';
  }

  getAudioContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('aryabhatta_sfx_muted', String(this.isMuted));
    if (!this.isMuted) {
      this.playClick();
    }
    return this.isMuted;
  }

  getMuteState() {
    return this.isMuted;
  }

  /**
   * Energetic Modern Electronic Intro Tone for Splash Screen
   * Creates a multi-oscillator cyberpunk/tech arpeggio with shimmer filter and lush reverb decay
   */
  playIntroTone() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Chord progression notes (frequencies in Hz): D4, F#4, A4, D5, E5, A5
    const notes = [293.66, 369.99, 440.0, 587.33, 659.25, 880.0];
    const delays = [0, 0.12, 0.24, 0.38, 0.52, 0.70];

    // Master bus
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.22, now);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 2.4);
    masterGain.connect(ctx.destination);

    // Filter sweep for high-tech resonance
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(5500, now + 0.8);
    filter.frequency.exponentialRampToValueAtTime(1200, now + 2.3);
    filter.Q.setValueAtTime(4.5, now);
    filter.connect(masterGain);

    notes.forEach((freq, idx) => {
      const noteStart = now + delays[idx];

      // Primary synth oscillator (sawtooth for warmth & energy)
      const osc = ctx.createOscillator();
      osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, noteStart);

      // Sub-harmonic shimmer oscillator (sine an octave higher)
      const shimmer = ctx.createOscillator();
      shimmer.type = 'sine';
      shimmer.frequency.setValueAtTime(freq * 2, noteStart);

      // Note envelope
      const noteGain = ctx.createGain();
      noteGain.gain.setValueAtTime(0, noteStart);
      noteGain.gain.linearRampToValueAtTime(0.18, noteStart + 0.04);
      noteGain.gain.exponentialRampToValueAtTime(0.001, noteStart + 1.2);

      osc.connect(noteGain);
      shimmer.connect(noteGain);
      noteGain.connect(filter);

      osc.start(noteStart);
      shimmer.start(noteStart);
      osc.stop(noteStart + 1.3);
      shimmer.stop(noteStart + 1.3);
    });

    // Sub-bass impact swell
    const subOsc = ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(73.42, now); // D2 sub bass
    subOsc.frequency.exponentialRampToValueAtTime(36.71, now + 1.5);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.28, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 1.9);
  }

  /**
   * Subtle UI click sound for buttons and tabs
   */
  playClick() {
    haptics.tap(20);
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * Success chime on valid login
   */
  playSuccess() {
    haptics.success();
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const start = now + idx * 0.07;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.12, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.36);
    });
  }

  /**
   * Error warning sound on invalid login
   */
  playError() {
    haptics.error();
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.setValueAtTime(120, now + 0.12);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }
}

export const sfx = new SoundEffectsEngine();
