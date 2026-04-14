import Taro from '@tarojs/taro';

interface GameStats {
  highScore: number;
  totalWins: number;
  longestWinStreak: number;
  currentWinStreak: number;
}

interface LevelProgress {
  maxUnlockedLevel: number;
  completedLevels: number[];
  bestTimes: Record<number, number>;
}

const STORAGE_KEY = 'dog_game_stats';
const LEVEL_PROGRESS_KEY = 'dog_game_level_progress';
const SETTINGS_KEY = 'dog_game_settings';

const DEFAULT_STATS: GameStats = {
  highScore: 0,
  totalWins: 0,
  longestWinStreak: 0,
  currentWinStreak: 0,
};

const DEFAULT_LEVEL_PROGRESS: LevelProgress = {
  maxUnlockedLevel: 1,
  completedLevels: [],
  bestTimes: {},
};

interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
}

const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  musicEnabled: true,
};

export const getSettings = (): GameSettings => {
  try {
    const saved = Taro.getStorageSync(SETTINGS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to get settings:', e);
  }
  return { ...DEFAULT_SETTINGS };
};

export const saveSettings = (settings: GameSettings) => {
  try {
    Taro.setStorageSync(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
};

export const toggleSound = () => {
  const settings = getSettings();
  settings.soundEnabled = !settings.soundEnabled;
  saveSettings(settings);
  return settings;
};

export const toggleMusic = () => {
  const settings = getSettings();
  settings.musicEnabled = !settings.musicEnabled;
  saveSettings(settings);
  return settings;
};

export const getGameStats = (): GameStats => {
  try {
    const saved = Taro.getStorageSync(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to get game stats:', e);
  }
  return { ...DEFAULT_STATS };
};

export const saveGameStats = (stats: GameStats) => {
  try {
    Taro.setStorageSync(STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save game stats:', e);
  }
};

export const recordWin = (score: number) => {
  const stats = getGameStats();
  
  if (score > stats.highScore) {
    stats.highScore = score;
  }
  
  stats.totalWins++;
  stats.currentWinStreak++;
  
  if (stats.currentWinStreak > stats.longestWinStreak) {
    stats.longestWinStreak = stats.currentWinStreak;
  }
  
  saveGameStats(stats);
};

export const recordLoss = () => {
  const stats = getGameStats();
  stats.currentWinStreak = 0;
  saveGameStats(stats);
};

export const resetStats = () => {
  saveGameStats({ ...DEFAULT_STATS });
};

export const getLevelProgress = (): LevelProgress => {
  try {
    const saved = Taro.getStorageSync(LEVEL_PROGRESS_KEY);
    if (saved) {
      const progress = JSON.parse(saved);
      
      if (progress.maxUnlockedLevel > 4) {
        progress.maxUnlockedLevel = 4;
      }
      
      progress.completedLevels = progress.completedLevels.filter((l: number) => l <= 4);
      
      const newBestTimes: Record<number, number> = {};
      for (const key in progress.bestTimes) {
        const level = parseInt(key);
        if (level <= 4) {
          newBestTimes[level] = progress.bestTimes[key];
        }
      }
      progress.bestTimes = newBestTimes;
      
      return progress;
    }
  } catch (e) {
    console.error('Failed to get level progress:', e);
  }
  return { ...DEFAULT_LEVEL_PROGRESS };
};

export const saveLevelProgress = (progress: LevelProgress) => {
  try {
    Taro.setStorageSync(LEVEL_PROGRESS_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save level progress:', e);
  }
};

export const completeLevel = (level: number, timeInSeconds?: number) => {
  const progress = getLevelProgress();
  
  if (!progress.completedLevels.includes(level)) {
    progress.completedLevels.push(level);
  }
  
  if (level >= progress.maxUnlockedLevel) {
    progress.maxUnlockedLevel = Math.min(level + 1, 4);
  }
  
  if (timeInSeconds !== undefined) {
    const currentBest = progress.bestTimes[level];
    if (currentBest === undefined || timeInSeconds < currentBest) {
      progress.bestTimes[level] = timeInSeconds;
    }
  }
  
  saveLevelProgress(progress);
  return progress;
};

export const getBestTime = (level: number): number | undefined => {
  const progress = getLevelProgress();
  return progress.bestTimes[level];
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const isLevelUnlocked = (level: number): boolean => {
  const progress = getLevelProgress();
  return level <= progress.maxUnlockedLevel;
};

export const isLevelCompleted = (level: number): boolean => {
  const progress = getLevelProgress();
  return progress.completedLevels.includes(level);
};
