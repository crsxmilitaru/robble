import { soundGenerator, type SoundType } from './sound-generator';

export const SOUNDS: Record<string, SoundType> = {
  PLACE: 'PLACE',
  PICKUP: 'PICKUP',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
  SHUFFLE: 'SHUFFLE',
  BINGO: 'BINGO',
  GAME_OVER: 'GAME_OVER',
  CLICK: 'CLICK'
};

class SoundManager {
  private muted = localStorage.getItem('robble-muted') === 'true';

  isMuted(): boolean {
    return this.muted;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    localStorage.setItem('robble-muted', String(this.muted));
    return this.muted;
  }

  play(sound: keyof typeof SOUNDS): void {
    if (this.muted) return;
    soundGenerator.play(SOUNDS[sound]);
  }
}

export const soundManager = new SoundManager();
