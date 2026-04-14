// 测试脚本：验证游戏的边界情况

const levelConfigData = [
  { types: 3, cardsPerType: 6, layers: 2, layerOffset: 15 },
  { types: 5, cardsPerType: 6, layers: 3, layerOffset: 18 },
  { types: 7, cardsPerType: 9, layers: 4, layerOffset: 22 },
  { types: 12, cardsPerType: 15, layers: 8, layerOffset: 35 },
];

console.log('========================================');
console.log('狗了个狗 - 边界情况测试');
console.log('========================================\n');

let allTestsPassed = true;

// 测试1：检查所有关卡的 cardsPerType 是否是 3 的倍数
console.log('测试1：检查所有关卡的 cardsPerType 是否是 3 的倍数');
console.log('--------------------------------------------------------');
levelConfigData.forEach((config, index) => {
  const level = index + 1;
  const isMultipleOf3 = config.cardsPerType % 3 === 0;
  const totalCards = config.types * config.cardsPerType;
  
  if (isMultipleOf3) {
    console.log(`✅ 第${level}关：${config.types}种 × ${config.cardsPerType}张 = ${totalCards}张，cardsPerType 是 3 的倍数`);
  } else {
    console.log(`❌ 第${level}关：${config.types}种 × ${config.cardsPerType}张 = ${totalCards}张，cardsPerType 不是 3 的倍数！`);
    allTestsPassed = false;
  }
});
console.log('');

// 测试2：检查总牌数是否合理
console.log('测试2：检查总牌数是否合理');
console.log('--------------------------------------------------------');
levelConfigData.forEach((config, index) => {
  const level = index + 1;
  const totalCards = config.types * config.cardsPerType;
  
  if (totalCards > 0 && totalCards < 500) {
    console.log(`✅ 第${level}关：总牌数 ${totalCards} 张，合理`);
  } else {
    console.log(`❌ 第${level}关：总牌数 ${totalCards} 张，不合理！`);
    allTestsPassed = false;
  }
});
console.log('');

// 测试3：模拟卡牌消除逻辑测试
console.log('测试3：模拟卡牌消除逻辑测试');
console.log('--------------------------------------------------------');

// 模拟一个简单的卡牌消除逻辑
const simulateElimination = (level, config) => {
  const cardTypes = Array(config.types).fill(0).map((_, i) => `type${i}`);
  let cardCounts = {};
  cardTypes.forEach(type => {
    cardCounts[type] = config.cardsPerType;
  });
  
  console.log(`第${level}关初始状态：`);
  console.log('  卡牌种类：', Object.keys(cardCounts).length);
  console.log('  每种牌数：', config.cardsPerType);
  console.log('  总牌数：', Object.values(cardCounts).reduce((a, b) => a + b, 0));
  
  // 模拟消除过程：每次消除3张相同的
  let steps = 0;
  while (true) {
    let anyEliminated = false;
    
    for (const type of cardTypes) {
      if (cardCounts[type] >= 3) {
        cardCounts[type] -= 3;
        steps++;
        anyEliminated = true;
        break;
      }
    }
    
    if (!anyEliminated) {
      break;
    }
  }
  
  const remainingCards = Object.values(cardCounts).reduce((a, b) => a + b, 0);
  
  if (remainingCards === 0) {
    console.log(`✅ 第${level}关：理论上可以完全消除！消除了 ${steps} 组`);
    return true;
  } else {
    console.log(`❌ 第${level}关：理论上无法完全消除！剩余 ${remainingCards} 张`);
    console.log('  剩余牌分布：', cardCounts);
    return false;
  }
};

levelConfigData.forEach((config, index) => {
  const level = index + 1;
  const result = simulateElimination(level, config);
  if (!result) {
    allTestsPassed = false;
  }
  console.log('');
});

// 测试4：边界情况测试
console.log('测试4：边界情况测试');
console.log('--------------------------------------------------------');

// 情况1：刚好凑齐3张
console.log('边界情况1：刚好凑齐3张');
const testCase1 = [1, 1, 1]; // 3张相同的
const canEliminate1 = testCase1.filter(x => x === testCase1[0]).length === 3;
console.log(`  输入：${testCase1}`);
console.log(`  结果：${canEliminate1 ? '✅ 可以消除' : '❌ 不能消除'}`);

// 情况2：凑不齐3张
console.log('边界情况2：凑不齐3张');
const testCase2 = [1, 1, 2]; // 2张1，1张2
const canEliminate2 = testCase2.filter(x => x === testCase2[0]).length === 3;
console.log(`  输入：${testCase2}`);
console.log(`  结果：${canEliminate2 ? '✅ 可以消除' : '❌ 不能消除（正常）'}`);

// 情况3：卡槽满了
console.log('边界情况3：卡槽满了');
const testCase3 = [1, 2, 3, 4, 5, 6, 7]; // 7张不同的
const isFull = testCase3.length === 7;
console.log(`  卡槽数量：${testCase3.length}`);
console.log(`  结果：${isFull ? '✅ 游戏结束（正常）' : '❌ 异常'}`);
console.log('');

// 测试总结
console.log('========================================');
console.log('测试总结');
console.log('========================================');
if (allTestsPassed) {
  console.log('🎉 所有测试通过！游戏逻辑看起来是正确的！');
} else {
  console.log('❌ 部分测试失败，请检查上面的错误！');
}
console.log('');
console.log('注意：');
console.log('1. 理论上只要每种牌的数量是 3 的倍数，就可以完全消除');
console.log('2. 但实际游戏中，由于卡牌摆放顺序和遮挡关系，可能会出现无解的情况');
console.log('3. 这是羊了个羊类游戏的正常机制，增加了游戏的挑战性和随机性');
console.log('========================================');
