import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { getGameStats, getLevelProgress, isLevelCompleted, getBestTime, formatTime, getSettings, toggleSound, toggleMusic } from '@/utils/storage';
import { LEVELS } from '@/data/levels';
import styles from './index.module.scss';

const MinePage: React.FC = () => {
  const [showGameStats, setShowGameStats] = useState(false);
  const [showGameGuide, setShowGameGuide] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [gameStats, setGameStats] = useState(getGameStats());
  const [levelProgress, setLevelProgress] = useState(getLevelProgress());
  const [settings, setSettings] = useState(getSettings());

  useEffect(() => {
    setGameStats(getGameStats());
    setLevelProgress(getLevelProgress());
    setSettings(getSettings());
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setGameStats(getGameStats());
      setLevelProgress(getLevelProgress());
      setSettings(getSettings());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const isDogKingUnlocked = levelProgress.completedLevels.length === 4;

  const menuItems = [
    {
      icon: '📊',
      text: '游戏记录',
      onClick: () => setShowGameStats(true)
    },
    {
      icon: '📖',
      text: '游戏说明',
      onClick: () => setShowGameGuide(true)
    },
    {
      icon: '⚙️',
      text: '游戏设置',
      onClick: () => setShowSettings(true)
    },
    {
      icon: '❤️',
      text: '关于我们'
    }
  ];

  return (
    <View className={styles.container}>
      <View className={styles.profile}>
        <View className={styles.avatar}>🐕</View>
        <Text className={styles.nickname}>狗狗玩家</Text>
        <Text className={styles.signature}>开心消除，快乐生活！</Text>
      </View>

      <View className={styles.achievementCard}>
        <View className={styles.achievementHeader}>
          <Text className={styles.achievementTitle}>🏆 狗王勋章</Text>
          {isDogKingUnlocked && (
            <View className={styles.dogKingBadge}>
              <Text className={styles.dogKingText}>👑 狗王</Text>
            </View>
          )}
        </View>
        <Text className={styles.achievementDesc}>
          {isDogKingUnlocked 
            ? '恭喜！你已成为真正的狗王！' 
            : '通关所有4个关卡，解锁狗王勋章！'}
        </Text>
        <View className={styles.progressBar}>
          <View className={styles.progressTrack}>
            <View 
              className={styles.progressFill}
              style={{ width: `${(levelProgress.completedLevels.length / 4) * 100}%` }}
            />
          </View>
          <Text className={styles.progressText}>
            {levelProgress.completedLevels.length} / 4
          </Text>
        </View>
        <View className={styles.levelChecklist}>
          {LEVELS.map((level) => {
            const completed = isLevelCompleted(level.id);
            const bestTime = getBestTime(level.id);
            return (
              <View 
                key={level.id} 
                className={`${styles.checkItem} ${completed ? styles.checked : ''}`}
              >
                <Text className={styles.checkIcon}>{completed ? '✓' : '○'}</Text>
                <Text className={styles.checkText}>{level.name}</Text>
                {completed && bestTime !== undefined && (
                  <Text className={styles.bestTime}>⏱️ {formatTime(bestTime)}</Text>
                )}
              </View>
            );
          })}
        </View>
      </View>

      <View className={styles.statsCard}>
        <Text className={styles.cardTitle}>游戏数据</Text>
        <View className={styles.statsGrid}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{gameStats.totalWins}</Text>
            <Text className={styles.statLabel}>通关次数</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{gameStats.highScore}</Text>
            <Text className={styles.statLabel}>最高分数</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{gameStats.longestWinStreak}</Text>
            <Text className={styles.statLabel}>最长连胜</Text>
          </View>
        </View>
      </View>

      <View className={styles.menuList}>
        {menuItems.map((item, index) => (
          <View key={index} className={styles.menuItem} onClick={item.onClick}>
            <View className={styles.menuLeft}>
              <Text className={styles.menuIcon}>{item.icon}</Text>
              <Text className={styles.menuText}>{item.text}</Text>
            </View>
            <Text className={styles.menuArrow}>{'>'}</Text>
          </View>
        ))}
      </View>

      {showGameStats && (
        <View className={styles.modalOverlay} onClick={() => setShowGameStats(false)}>
          <View className={styles.modal} onClick={e => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>📊 游戏记录</Text>
              <Text className={styles.modalClose} onClick={() => setShowGameStats(false)}>✕</Text>
            </View>
            <ScrollView className={styles.modalContent} scrollY>
              <View className={styles.detailStats}>
                <View className={styles.detailItem}>
                  <Text className={styles.detailIcon}>🏆</Text>
                  <View className={styles.detailInfo}>
                    <Text className={styles.detailLabel}>最高分</Text>
                    <Text className={styles.detailValue}>{gameStats.highScore}</Text>
                  </View>
                </View>
                <View className={styles.detailItem}>
                  <Text className={styles.detailIcon}>🎮</Text>
                  <View className={styles.detailInfo}>
                    <Text className={styles.detailLabel}>通关次数</Text>
                    <Text className={styles.detailValue}>{gameStats.totalWins}</Text>
                  </View>
                </View>
                <View className={styles.detailItem}>
                  <Text className={styles.detailIcon}>🔥</Text>
                  <View className={styles.detailInfo}>
                    <Text className={styles.detailLabel}>最长连胜</Text>
                    <Text className={styles.detailValue}>{gameStats.longestWinStreak}</Text>
                  </View>
                </View>
                <View className={styles.detailItem}>
                  <Text className={styles.detailIcon}>📈</Text>
                  <View className={styles.detailInfo}>
                    <Text className={styles.detailLabel}>当前连胜</Text>
                    <Text className={styles.detailValue}>{gameStats.currentWinStreak}</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {showGameGuide && (
        <View className={styles.modalOverlay} onClick={() => setShowGameGuide(false)}>
          <View className={styles.modal} onClick={e => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>📖 游戏说明</Text>
              <Text className={styles.modalClose} onClick={() => setShowGameGuide(false)}>✕</Text>
            </View>
            <ScrollView className={styles.modalContent} scrollY>
              <View className={styles.guideSection}>
                <Text className={styles.guideTitle}>🎯 游戏目标</Text>
                <Text className={styles.guideText}>消除所有卡牌，通关所有关卡！</Text>
              </View>

              <View className={styles.guideSection}>
                <Text className={styles.guideTitle}>📱 操作说明</Text>
                <View className={styles.guideStep}>
                  <Text className={styles.guideStepNum}>1️⃣</Text>
                  <Text className={styles.guideStepText}>点击未被遮挡的卡牌</Text>
                </View>
                <View className={styles.guideStep}>
                  <Text className={styles.guideStepNum}>2️⃣</Text>
                  <Text className={styles.guideStepText}>凑齐3张相同的就能消除</Text>
                </View>
                <View className={styles.guideStep}>
                  <Text className={styles.guideStepNum}>3️⃣</Text>
                  <Text className={styles.guideStepText}>卡槽满了就输了哦～</Text>
                </View>
              </View>

              <View className={styles.guideSection}>
                <Text className={styles.guideTitle}>🎮 道具说明</Text>
                <View className={styles.guideTool}>
                  <Text className={styles.guideToolIcon}>↩️</Text>
                  <View className={styles.guideToolInfo}>
                    <Text className={styles.guideToolName}>撤回</Text>
                    <Text className={styles.guideToolDesc}>每局有2次机会，回到上一步</Text>
                  </View>
                </View>
                <View className={styles.guideTool}>
                  <Text className={styles.guideToolIcon}>🔄</Text>
                  <View className={styles.guideToolInfo}>
                    <Text className={styles.guideToolName}>洗牌</Text>
                    <Text className={styles.guideToolDesc}>每局有2次机会，重新打乱卡牌</Text>
                  </View>
                </View>
              </View>

              <View className={styles.guideSection}>
                <Text className={styles.guideTitle}>💡 小技巧</Text>
                <View className={styles.guideTip}>
                  <Text className={styles.guideTipText}>• 优先消除上面的卡牌</Text>
                </View>
                <View className={styles.guideTip}>
                  <Text className={styles.guideTipText}>• 合理规划卡槽空间</Text>
                </View>
                <View className={styles.guideTip}>
                  <Text className={styles.guideTipText}>• 道具要在关键时刻使用</Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {showSettings && (
        <View className={styles.modalOverlay} onClick={() => setShowSettings(false)}>
          <View className={styles.modal} onClick={e => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>⚙️ 游戏设置</Text>
              <Text className={styles.modalClose} onClick={() => setShowSettings(false)}>✕</Text>
            </View>
            <ScrollView className={styles.modalContent} scrollY>
              <View className={styles.settingsList}>
                <View className={styles.settingItem}>
                  <View className={styles.settingLeft}>
                    <Text className={styles.settingIcon}>🔊</Text>
                    <Text className={styles.settingText}>音效</Text>
                  </View>
                  <View 
                    className={`${styles.switch} ${settings.soundEnabled ? styles.on : ''}`}
                    onClick={() => {
                      const newSettings = toggleSound();
                      setSettings(newSettings);
                    }}
                  >
                    <View className={styles.switchDot} />
                  </View>
                </View>
                <View className={styles.settingItem}>
                  <View className={styles.settingLeft}>
                    <Text className={styles.settingIcon}>🎵</Text>
                    <Text className={styles.settingText}>音乐</Text>
                  </View>
                  <View 
                    className={`${styles.switch} ${settings.musicEnabled ? styles.on : ''}`}
                    onClick={() => {
                      const newSettings = toggleMusic();
                      setSettings(newSettings);
                    }}
                  >
                    <View className={styles.switchDot} />
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
};

export default MinePage;
