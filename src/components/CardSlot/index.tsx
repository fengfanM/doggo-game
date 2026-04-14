import React from 'react';
import { View, Text } from '@tarojs/components';
import { Card } from '@/types/game';
import GameCard from '@/components/GameCard';
import styles from './index.module.scss';

interface CardSlotProps {
  queue: Card[];
  maxSlots?: number;
}

const CardSlot: React.FC<CardSlotProps> = ({ queue, maxSlots = 7 }) => {
  const remainingSlots = maxSlots - queue.length;
  
  return (
    <View className={styles.slotContainer}>
      <View className={styles.slotHeader}>
        <Text className={styles.slotTitle}>卡槽</Text>
        <Text className={styles.slotCount}>
          {queue.length}/{maxSlots}
          {remainingSlots > 0 && (
            <Text className={styles.slotHint}> 还能放{remainingSlots}个</Text>
          )}
          {remainingSlots === 0 && (
            <Text className={styles.slotDanger}> 满了！</Text>
          )}
        </Text>
      </View>
      <View className={styles.slots}>
        {Array.from({ length: maxSlots }).map((_, index) => {
          const card = queue[index];
          if (card) {
            return (
              <GameCard
                key={card.id}
                card={card}
                x={0}
                y={0}
                zIndex={index}
                small
              />
            );
          }
          return (
            <View
              key={`slot-${index}`}
              className={styles.emptySlot}
            />
          );
        })}
      </View>
    </View>
  );
};

export default CardSlot;
