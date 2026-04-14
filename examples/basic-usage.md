# 基本使用示例

## 项目结构

```
sheep/             # 项目根目录
├── src/           # 源代码
│   ├── pages/     # 页面
│   ├── components/ # 组件
│   └── utils/     # 工具函数
├── config/        # 配置
└── dist/          # 构建输出
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 开发模式

```bash
npm run dev:weapp
```

### 3. 生产构建

```bash
npm run build:weapp
```

## 核心功能示例

### 卡牌生成

```typescript
// src/utils/game.ts
import { generateCards } from './game';

// 生成第1关卡牌
const level = 1;
const cards = generateCards(level);
console.log('生成的卡牌:', cards);
```

### 游戏状态管理

```typescript
// src/pages/game/index.tsx
import { useState, useEffect } from 'react';

const GamePage = () => {
  const [cards, setCards] = useState([]);
  const [slot, setSlot] = useState([]);
  const [score, setScore] = useState(0);
  
  // 初始化游戏
  useEffect(() => {
    const initialCards = generateCards(1);
    setCards(initialCards);
  }, []);
  
  // 处理卡牌点击
  const handleCardClick = (card) => {
    // 卡牌点击逻辑
  };
  
  return (
    <div className="game-page">
      {/* 游戏内容 */}
    </div>
  );
};
```

### 本地存储

```typescript
// src/utils/storage.ts
import { saveGameRecord, getGameRecord } from './storage';

// 保存游戏记录
saveGameRecord(1, {
  completed: true,
  time: 120, // 秒
  score: 1000
});

// 获取游戏记录
const record = getGameRecord(1);
console.log('游戏记录:', record);
```

## 自定义配置

### 修改关卡配置

```typescript
// src/data/levels.ts
const levelConfig = [
  {
    types: 3,        // 卡牌种类数
    cardsPerType: 6, // 每种卡牌数量
    layers: 2,       // 层数
    layerOffset: 15  // 层偏移
  },
  // ... 其他关卡
];
```

### 添加新卡牌

```typescript
// src/utils/game.ts
export const DOG_EMOJIS = [
  '🐕', '🐶', '🐩', '🦮', '🐕‍🦺',
  // 添加更多表情
];
```

## 开发工具

### 代码检查

```bash
# TypeScript 类型检查
npm run typecheck

# ESLint 代码检查
npm run lint

# ESLint 自动修复
npm run lint:fix
```

### 测试

```bash
# 运行测试
npm test

# 运行测试并生成覆盖率报告
npm test -- --coverage
```

### 自动化脚本

```bash
# 自动提交并推送
npm run auto-commit "你的提交信息"
```

## 部署

1. 在微信开发者工具中构建项目
2. 点击「上传」按钮
3. 在微信公众平台发布

## 常见问题

### Q: 游戏卡顿怎么办？

**A:** 可以尝试：
- 减少卡牌数量
- 优化渲染逻辑
- 使用 `React.memo` 优化组件

### Q: 如何添加新功能？

**A:** 按照以下步骤：
1. 创建新组件或修改现有组件
2. 更新相关逻辑
3. 运行测试确保无错误
4. 提交代码并推送

### Q: 如何调试游戏？

**A:** 可以使用：
- 微信开发者工具的调试功能
- `console.log` 打印调试信息
- 在 `src/utils/game.ts` 中使用 `debugCardCounts` 函数
