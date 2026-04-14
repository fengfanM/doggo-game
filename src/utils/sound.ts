import Taro from '@tarojs/taro';

export type SoundType = 
  | 'click' 
  | 'eliminate' 
  | 'shuffle' 
  | 'win' 
  | 'lose' 
  | 'bgm';

interface SoundConfig {
  volume: number;
  enabled: boolean;
  bgmEnabled: boolean;
}

class SoundManager {
  private config: SoundConfig = {
    volume: 0.5,
    enabled: true,
    bgmEnabled: true
  };
  
  constructor() {
    this.loadConfig();
  }
  
  private loadConfig() {
    try {
      const saved = Taro.getStorageSync('soundConfig');
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Failed to load sound config:', e);
    }
  }
  
  private saveConfig() {
    try {
      Taro.setStorageSync('soundConfig', JSON.stringify(this.config));
    } catch (e) {
      console.error('Failed to save sound config:', e);
    }
  }
  
  setVolume(volume: number) {
    this.config.volume = Math.max(0, Math.min(1, volume));
    this.saveConfig();
  }
  
  getVolume(): number {
    return this.config.volume;
  }
  
  setEnabled(enabled: boolean) {
    this.config.enabled = enabled;
    this.saveConfig();
  }
  
  isEnabled(): boolean {
    return this.config.enabled;
  }
  
  setBgmEnabled(enabled: boolean) {
    this.config.bgmEnabled = enabled;
    this.saveConfig();
  }
  
  isBgmEnabled(): boolean {
    return this.config.bgmEnabled;
  }
  
  play(type: SoundType) {
    if (!this.config.enabled && type !== 'bgm') return;
    if (type === 'bgm' && !this.config.bgmEnabled) return;
    
    console.log(`🔊 播放音效: ${type}`);
  }
}

export default new SoundManager();
