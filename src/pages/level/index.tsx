import React, { useState, useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { LEVELS } from '@/data/levels';
import { Level } from '@/types/game';
import { getLevelProgress, isLevelUnlocked, isLevelCompleted } from '@/utils/storage';
import styles from './index.module.scss';

const LevelPage: React.FC = () => {
  const [levelProgress, setLevelProgress] = useState(getLevelProgress());
  const [showLockedModal, setShowLockedModal] = useState(false);
  const [lockedLevel, setLockedLevel] = useState<Level | null>(null);

  useEffect(() => {
    setLevelProgress(getLevelProgress());
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setLevelProgress(getLevelProgress());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getDifficultyText = (difficulty: string) => {
    const map: Record<string, string> = {
      easy: '简单',
      medium: '中等',
      hard: '困难'
    };
    return map[difficulty] || difficulty;
  };

  const handleLevelClick = (level: Level) => {
    if (!isLevelUnlocked(level.id)) {
      setLockedLevel(level);
      setShowLockedModal(true);
      return;
    }
    Taro.setStorageSync('selectedLevel', level);
    Taro.switchTab({
      url: '/pages/game/index'
    });
  };

  const getLevelIcon = (levelId: number) => {
    const unlocked = isLevelUnlocked(levelId);
    const completed = isLevelCompleted(levelId);
    
    if (completed) return '✅';
    if (!unlocked) return '🔒';
    return '🎯';
  };

  const requiredLevel = lockedLevel ? LEVELS.find(l => l.id === lockedLevel.id - 1) : null;

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <Text className={styles.title}>🎮 关卡选择</Text>
        <Text className={styles.subtitle}>挑战关卡进度：{levelProgress.completedLevels.length} / 4</Text>
      </View>

      <View className={styles.levelList}>
        {LEVELS.map((level) => {
          const unlocked = isLevelUnlocked(level.id);
          const completed = isLevelCompleted(level.id);
          
          return (
            <View
              key={level.id}
              className={`${styles.levelCard} ${!unlocked ? styles.locked : ''} ${completed ? styles.completed : ''}`}
              onClick={() => handleLevelClick(level)}
            >
              <View className={styles.levelHeader}>
                <View className={styles.levelTitleRow}>
                  <Text className={styles.levelIcon}>{getLevelIcon(level.id)}</Text>
                  <Text className={styles.levelName}>{level.name}</Text>
                </View>
                <Text
                  className={`${styles.difficulty} ${styles[level.difficulty]}`}
                >
                  {getDifficultyText(level.difficulty)}
                </Text>
              </View>

              <View className={styles.levelInfo}>
                <View className={styles.infoItem}>
                  <Text className={styles.infoLabel}>卡牌种类</Text>
                  <Text className={styles.infoValue}>{level.cardTypes.length}种</Text>
                </View>
                <View className={styles.infoItem}>
                  <Text className={styles.infoLabel}>卡牌数量</Text>
                  <Text className={styles.infoValue}>{level.cardCount}张</Text>
                </View>
              </View>

              <Text className={styles.levelDescription}>{level.description}</Text>

              {completed && (
                <View className={styles.completedBadge}>
                  <Text className={styles.completedText}>✓ 已通关</Text>
                </View>
              )}
              {!unlocked && (
                <View className={styles.lockedBadge}>
                  <Text className={styles.lockedText}>🔒 未解锁</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {showLockedModal && lockedLevel && (
        <View className={styles.modalOverlay} onClick={() => setShowLockedModal(false)}>
          <View className={styles.modal} onClick={e => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>🔒 关卡未解锁</Text>
              <Text className={styles.modalClose} onClick={() => setShowLockedModal(false)}>✕</Text>
            </View>
            <View className={styles.modalContent}>
              <Text className={styles.lockedEmoji}>🔐</Text>
              <Text className={styles.lockedLevelName}>{lockedLevel.name}</Text>
              <Text className={styles.lockedDesc}>此关卡暂时无法进入</Text>
              
              {requiredLevel && (
                <View className={styles.requirementBox}>
                  <Text className={styles.requirementTitle}>解锁条件</Text>
                  <View className={styles.requirementItem}>
                    <Text className={styles.requirementIcon}>🎯</Text>
                    <Text className={styles.requirementText}>完成「{requiredLevel.name}」</Text>
                  </View>
                </View>
              )}

              <Text className={styles.tipText}>加油挑战前面的关卡吧！</Text>
            </View>
            <View className={styles.modalFooter}>
              <Text className={styles.confirmButton} onClick={() => setShowLockedModal(false)}>
                我知道了
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default LevelPage;
