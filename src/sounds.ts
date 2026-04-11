export const SOUNDS = {
  PLACE: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  PICKUP: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  SUCCESS: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
  ERROR: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3',
  SHUFFLE: 'https://assets.mixkit.co/active_storage/sfx/1110/1110-preview.mp3',
  BINGO: 'https://assets.mixkit.co/active_storage/sfx/1433/1433-preview.mp3',
  GAME_OVER: 'https://assets.mixkit.co/active_storage/sfx/1437/1437-preview.mp3',
  CLICK: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'
};

class SoundManager {
  private audios = new Map<string, HTMLAudioElement>();
  constructor() { this.preload(); }
  private preload() {
    Object.entries(SOUNDS).forEach(([key, url]) => {
      const audio = new Audio(url); audio.load(); this.audios.set(key, audio);
    });
  }
  play(sound: keyof typeof SOUNDS) {
    const audio = this.audios.get(sound);
    if (audio) { audio.currentTime = 0; audio.play().catch(() => { }); }
  }
}
export const soundManager = new SoundManager();
