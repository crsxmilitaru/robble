export type SoundType =
  | 'PLACE'
  | 'PICKUP'
  | 'SUCCESS'
  | 'ERROR'
  | 'SHUFFLE'
  | 'BINGO'
  | 'GAME_OVER'
  | 'CLICK';

class SoundGenerator {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  private init(): AudioContext {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  private getGain(): GainNode | null {
    this.init();
    return this.masterGain;
  }

  // Short click/pop for tile interactions
  private playClickTone(ctx: AudioContext, dest: AudioNode, duration = 0.05): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + duration);
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  // Wood/plastic thud for placing tiles
  private playPlaceTone(ctx: AudioContext, dest: AudioNode): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.6, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  }

  // Rising tone for pickup
  private playPickupTone(ctx: AudioContext, dest: AudioNode): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  }

  // Pleasant chime for success
  private playSuccessTone(ctx: AudioContext, dest: AudioNode): void {
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.05);
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.05);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.05 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.05 + 0.3);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(ctx.currentTime + i * 0.05);
      osc.stop(ctx.currentTime + i * 0.05 + 0.35);
    });
  }

  // Low buzz for error
  private playErrorTone(ctx: AudioContext, dest: AudioNode): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  }

  // Rushing sound for shuffle
  private playShuffleTone(ctx: AudioContext, dest: AudioNode): void {
    const bufferSize = ctx.sampleRate * 0.3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(2000, ctx.currentTime + 0.3);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    noise.start();
    noise.stop(ctx.currentTime + 0.3);
  }

  // Fanfare for bingo/high score
  private playBingoTone(ctx: AudioContext, dest: AudioNode): void {
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + i * 0.08 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.5);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + i * 0.08 + 0.55);
    });
  }

  // Descending tone for game over
  private playGameOverTone(ctx: AudioContext, dest: AudioNode): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.6);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.4);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  }

  play(sound: SoundType): void {
    const ctx = this.init();
    const dest = this.getGain();
    if (!dest) return;

    // Resume context if suspended (browser policy)
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    switch (sound) {
      case 'CLICK':
        this.playClickTone(ctx, dest);
        break;
      case 'PLACE':
        this.playPlaceTone(ctx, dest);
        break;
      case 'PICKUP':
        this.playPickupTone(ctx, dest);
        break;
      case 'SUCCESS':
        this.playSuccessTone(ctx, dest);
        break;
      case 'ERROR':
        this.playErrorTone(ctx, dest);
        break;
      case 'SHUFFLE':
        this.playShuffleTone(ctx, dest);
        break;
      case 'BINGO':
        this.playBingoTone(ctx, dest);
        break;
      case 'GAME_OVER':
        this.playGameOverTone(ctx, dest);
        break;
    }
  }
}

export const soundGenerator = new SoundGenerator();
