import { Level } from '@/types/game';

export const DOG_EMOJIS = [
  '🐕',
  '🐶',
  '🐩',
  '🦮',
  '🐕‍🦺',
  '🐾',
  '🦴',
  '🎾',
  '🏆',
  '⭐',
  '🥎',
  '🎯'
];

const levelConfig = [
  { types: 3, cardsPerType: 6, layers: 2, layerOffset: 15 },
  { types: 5, cardsPerType: 6, layers: 3, layerOffset: 18 },
  { types: 7, cardsPerType: 9, layers: 4, layerOffset: 22 },
  { types: 12, cardsPerType: 15, layers: 8, layerOffset: 35 },
];

export const LEVELS: Level[] = [
  {
    id: 1,
    name: '新手试炼',
    difficulty: 'easy',
    cardTypes: ['🐕', '🐶', '🐩'],
    cardCount: levelConfig[0].types * levelConfig[0].cardsPerType,
    description: '让你觉得你很行～'
  },
  {
    id: 2,
    name: '初露锋芒',
    difficulty: 'easy',
    cardTypes: ['🐕', '🐶', '🐩', '🦮', '🐕‍🦺'],
    cardCount: levelConfig[1].types * levelConfig[1].cardsPerType,
    description: '难度逐渐增加'
  },
  {
    id: 3,
    name: '极限挑战',
    difficulty: 'hard',
    cardTypes: ['🐕', '🐶', '🐩', '🦮', '🐕‍🦺', '🐾', '🦴'],
    cardCount: levelConfig[2].types * levelConfig[2].cardsPerType,
    description: '开始有挑战了！'
  },
  {
    id: 4,
    name: '狗王挑战',
    difficulty: 'hard',
    cardTypes: ['🐕', '🐶', '🐩', '🦮', '🐕‍🦺', '🐾', '🦴', '🎾', '🏆', '⭐', '🥎', '🎯'],
    cardCount: levelConfig[3].types * levelConfig[3].cardsPerType,
    description: '终极变态难度！通关率<5%'
  }
];
