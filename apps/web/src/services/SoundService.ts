import { useGameStore } from '../stores/gameStore';

/**
 * SoundService synthesizes playful, high-fidelity retro audio chimes
 * using the native browser Web Audio API AudioContext without external audio files.
 */
export class SoundService {
  private audioCtx: AudioContext | null = null;

  constructor() {
    this.attachAutoplayUnlock();
  }

  private attachAutoplayUnlock(): void {
    const unlock = () => {
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      window?.removeEventListener?.('pointerdown', unlock);
      window?.removeEventListener?.('keydown', unlock);
    };

    window?.addEventListener?.('pointerdown', unlock, { passive: true });
    window?.addEventListener?.('keydown', unlock, { passive: true });
  }

  private getContext(): AudioContext | null {
    if (!this.audioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    return this.audioCtx;
  }

  private isMuted(): boolean {
    try {
      const gameStore = useGameStore();
      return gameStore.audioMuted;
    } catch {
      return false;
    }
  }

  /**
   * Soft bubble pop for button clicks and modal openings.
   */
  playPop(): void {
    if (this.isMuted()) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(760, now + 0.06);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };

    osc.start(now);
    osc.stop(now + 0.09);
  }

  /**
   * Celebratory multi-tone major chord arpeggio for egg hatching.
   */
  playHatchFanfare(): void {
    if (this.isMuted()) return;
    const ctx = this.getContext();
    if (!ctx) return;

    // Major chord arpeggio notes: C5, E5, G5, C6
    const chordNotes = [523.25, 659.25, 783.99, 1046.5];
    const baseTime = ctx.currentTime;

    chordNotes.forEach((freq, idx) => {
      const startTime = baseTime + idx * 0.09;
      const duration = idx === chordNotes.length - 1 ? 0.35 : 0.14;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };

      osc.start(startTime);
      osc.stop(startTime + duration + 0.02);
    });
  }

  /**
   * Cute high-pitched penguin chirp when petted.
   */
  playChirp(): void {
    if (this.isMuted()) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Frequency chirp: 1400Hz -> 2600Hz -> 1900Hz
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.linearRampToValueAtTime(2600, now + 0.06);
    osc.frequency.linearRampToValueAtTime(1900, now + 0.14);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };

    osc.start(now);
    osc.stop(now + 0.16);
  }

  /**
   * Gentle playful crunch/munch for feeding.
   */
  playEat(): void {
    if (this.isMuted()) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const baseTime = ctx.currentTime;
    // Two quick playful bites
    const bites = [0, 0.11];

    bites.forEach((offset) => {
      const startTime = baseTime + offset;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(360, startTime);
      osc.frequency.exponentialRampToValueAtTime(140, startTime + 0.07);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.075);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };

      osc.start(startTime);
      osc.stop(startTime + 0.08);
    });
  }

  /**
   * Bright, metallic coin drop sound when collecting coins or coin drops bounce.
   */
  playCoinDrop(): void {
    if (this.isMuted()) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now);
    osc.frequency.setValueAtTime(1318.51, now + 0.06);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };

    osc.start(now);
    osc.stop(now + 0.19);
  }

  /**
   * Victorious level-up fanfare celebrating progression.
   */
  playLevelUp(): void {
    if (this.isMuted()) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [523.25, 783.99, 1046.5, 1318.51];
    const baseTime = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const startTime = baseTime + idx * 0.08;
      const duration = idx === notes.length - 1 ? 0.4 : 0.12;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };

      osc.start(startTime);
      osc.stop(startTime + duration + 0.02);
    });
  }

  /**
   * Cash register / crisp purchase confirmation ding.
   */
  playBuySuccess(): void {
    if (this.isMuted()) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const baseTime = ctx.currentTime;
    const notes = [1046.5, 1567.98];

    notes.forEach((freq, idx) => {
      const startTime = baseTime + idx * 0.07;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.18, startTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };

      osc.start(startTime);
      osc.stop(startTime + 0.16);
    });
  }
}

export const soundService = new SoundService();
