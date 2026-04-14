# 🐕 狗了个狗 - 超好玩的消除游戏

一款基于 Taro 框架开发的微信小程序游戏，复刻经典"羊了个羊"玩法，带你体验不一样的消除乐趣！

---

## ⚠️ 原创声明

**本项目为原创作品，保留所有权利。**

- 任何个人或组织在复制、使用、修改或分发本项目的代码、文档或其他资源前，**必须**提前通知作者并获得书面授权。
- 未经授权的复制、使用或分发行为将被视为侵权，作者保留追究法律责任的权利。
- 如需合作或授权，请通过 GitHub 联系作者：https://github.com/fengfanM

---

---

## 📋 目录

- [游戏玩法](#-游戏玩法)
- [技术栈](#-技术栈)
- [项目结构](#-项目结构)
- [核心功能实现](#-核心功能实现)
- [关卡设计](#-关卡设计)
- [快速开始](#-快速开始)
- [开发指南](#-开发指南)

---

## 🎮 游戏玩法

### 基本规则
1. **点击卡牌**：点击游戏区域中的卡牌，将其放入底部卡槽
2. **消除规则**：当卡槽中有 **3 张相同类型**的卡牌时，自动消除
3. **失败条件**：卡槽满了（超过 7 张）且无法消除时，游戏失败
4. **胜利条件**：消除场上所有卡牌，游戏胜利

### 道具系统
- **🔄 撤回**：撤回上一步操作（每关限用 2 次）
- **🔀 洗牌**：随机打乱场上卡牌位置（每关限用 2 次）

### 重新开始机制
- **第 1 次失败**：免费重新开始（返还撤回和洗牌次数）
- **第 2 次及以后**：需分享到微信群获取重新开始机会

---

## 🛠️ 技术栈

| 类别 | 技术选型 | 版本 |
|------|----------|------|
| **框架** | Taro | 4.1.9 |
| **开发语言** | TypeScript | 5.x |
| **样式** | SCSS | - |
| **UI 组件** | Taro UI | - |
| **编译工具** | Webpack | - |
| **目标平台** | 微信小程序 | - |

---

## 📁 项目结构

```
sheep/
├── src/
│   ├── pages/              # 页面
│   │   ├── game/           # 游戏主页面
│   │   ├── level/          # 关卡选择页面
│   │   └── mine/           # 我的页面
│   ├── components/         # 组件
│   │   ├── GameCard/       # 游戏卡牌组件
│   │   ├── GameBoard/      # 游戏棋盘组件
│   │   └── CardSlot/       # 卡槽组件
│   ├── data/               # 数据
│   │   └── levels.ts       # 关卡配置
│   ├── utils/              # 工具函数
│   │   ├── game.ts         # 游戏核心逻辑
│   │   ├── storage.ts      # 本地存储
│   │   ├── sound.ts        # 音效管理
│   │   └── dailyTasks.ts   # 每日任务
│   ├── styles/             # 全局样式
│   ├── app.ts              # 应用入口
│   └── app.config.ts       # 应用配置
├── config/                 # Taro 配置
├── dist/                   # 编译输出
└── package.json
```

---

## 🧠 核心功能实现

### 1. 卡牌生成与布局算法

**文件位置**：`src/utils/game.ts`

#### 核心流程
```typescript
// 1. 根据关卡配置生成卡牌池
const iconPool = DOG_EMOJIS.slice(0, config.types);
const cards: Card[] = [];
for (let i = 0; i < config.types; i++) {
  for (let j = 0; j < config.cardsPerType; j++) {
    cards.push({
      id: `${i}-${j}`,
      type: iconPool[i]
    });
  }
}

// 2. 随机打乱卡牌顺序
const shuffledCards = shuffleArray(cards);

// 3. 分层放置卡牌（上层覆盖下层）
for (let layer = 0; layer < config.layers; layer++) {
  // 计算每层卡牌位置
  // 添加偏移量，使卡牌错落有致
}

// 4. 特殊关卡算法（第 4 关）
// 使相同类型的卡牌分散在不同层，提升难度
```

#### 关键特性
- ✅ 确保每种卡牌数量为 3 的倍数
- ✅ 随机化卡牌位置，增加游戏性
- ✅ 分层设计，上层卡牌遮挡下层
- ✅ 第 4 关采用分散算法，降低通关率

---

### 2. 遮挡检测与点击判断

**文件位置**：`src/utils/game.ts` - `checkCover` 函数

```typescript
export function checkCover(cards: Card[]): Card[] {
  cards.forEach(card => {
    card.isCovered = false;
    card.coveringCards = [];
  });

  // 对于每张卡牌，检查是否有其他卡牌覆盖它
  cards.forEach((cardA, indexA) => {
    cards.forEach((cardB, indexB) => {
      if (indexA === indexB) return;
      
      // 判断是否有重叠且 cardB 在 cardA 上方
      const isOverlapping = checkOverlap(cardA, cardB);
      const isAbove = cardB.layer > cardA.layer;
      
      if (isOverlapping && isAbove) {
        cardA.isCovered = true;
        cardA.coveringCards!.push(cardB.id);
      }
    });
  });

  return cards;
}
```

---

### 3. 游戏状态管理

**文件位置**：`src/pages/game/index.tsx`

| 状态 | 说明 |
|------|------|
| `cards` | 场上所有卡牌 |
| `slot` | 卡槽中的卡牌 |
| `score` | 当前分数 |
| `undoCount` | 剩余撤回次数 |
| `shuffleCount` | 剩余洗牌次数 |
| `gamePaused` | 游戏是否暂停 |
| `showLoseModal` | 是否显示失败弹窗 |
| `showWinModal` | 是否显示胜利弹窗 |
| `failCount` | 失败次数（控制重新开始逻辑） |
| `hasShared` | 是否已分享（控制重新开始逻辑） |
| `elapsedTime` | 游戏用时（秒） |

---

### 4. 计时器实现

**解决闭包陷阱问题**：使用 `useRef` 存储最新状态

```typescript
const gameStateRef = useRef({
  gamePaused,
  showLoseModal,
  showWinModal,
  showStartScreen
});

useEffect(() => {
  gameStateRef.current = {
    gamePaused,
    showLoseModal,
    showWinModal,
    showStartScreen
  };
}, [gamePaused, showLoseModal, showWinModal, showStartScreen]);

useEffect(() => {
  timerRef.current = setInterval(() => {
    const { gamePaused, showLoseModal, showWinModal, showStartScreen } = gameStateRef.current;
    if (!gamePaused && !showLoseModal && !showWinModal && !showStartScreen) {
      setElapsedTime(prev => prev + 1);
    }
  }, 1000);
  
  return () => clearInterval(timerRef.current);
}, []);
```

---

### 5. 分享回调与自动重新开始

**文件位置**：`src/pages/game/index.tsx`

```typescript
// 全局 ref，用于在 onShareAppMessage 中更新状态
let setHasSharedRef: ((value: boolean) => void) | null = null;

export const onShareAppMessage = () => {
  try {
    Taro.setStorageSync(SHARE_STORAGE_KEY, Date.now());
    if (setHasSharedRef) {
      setHasSharedRef(true);
    }
    Taro.showToast({ title: '分享成功！', icon: 'success', duration: 1000 });
  } catch (e) {
    console.error('保存分享状态失败:', e);
  }
  return { title: '🐕 狗了个狗', path: '/pages/index/index' };
};

// 在组件中设置 ref
useEffect(() => {
  setHasSharedRef = setHasShared;
  return () => {
    setHasSharedRef = null;
  };
}, []);

// 监听分享状态，自动重新开始
useEffect(() => {
  if (hasShared && showLoseModal) {
    handleLoseConfirm();
  }
}, [hasShared, showLoseModal]);
```

---

## 🎯 关卡设计

| 关卡 | 种类数 | 每种卡牌数 | 总卡牌数 | 层数 | 难度 | 目标通关率 |
|------|--------|------------|----------|------|------|------------|
| 1 | 3 | 6 | 18 | 2 | ⭐ 简单 | > 90% |
| 2 | 5 | 6 | 30 | 3 | ⭐ 简单 | > 70% |
| 3 | 7 | 9 | 63 | 4 | ⭐⭐⭐ 困难 | < 30% |
| 4 | 12 | 15 | 180 | 8 | ⭐⭐⭐⭐⭐ 地狱 | < 5% |

### 第 4 关特殊算法
- ✅ 相同类型卡牌分散在不同层
- ✅ 增加卡牌种类和数量
- ✅ 增加层数和层偏移
- ✅ 目标：只有 5% 以内的玩家能通关

---

## 🚀 快速开始

### 环境要求
- Node.js >= 16
- npm 或 yarn
- 微信开发者工具

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev:weapp
```

### 生产构建
```bash
npm run build:weapp
```

### 微信开发者工具
1. 打开微信开发者工具
2. 选择「导入项目」
3. 项目目录选择 `dist` 文件夹
4. AppID 填入你的小程序 AppID

---

## 🤖 自动化脚本

### 本地自动提交推送

使用自动提交脚本，一键完成 git add → commit → push：

```bash
# 方式1：使用 npm 脚本
npm run auto-commit "你的提交信息"

# 方式2：直接运行脚本
./scripts/auto-commit.sh "你的提交信息"

# 方式3：不带提交信息（使用默认信息）
npm run auto-commit
```

**脚本功能**：
- ✅ 自动检查 git 状态
- ✅ 自动添加所有修改的文件
- ✅ 自动创建提交
- ✅ 自动拉取最新代码（避免冲突）
- ✅ 自动推送到远程仓库
- 🎨 漂亮的彩色输出

---

## 🔄 CI/CD 流程

项目已配置 GitHub Actions CI/CD 流程，每次推送代码或创建 Pull Request 时会自动运行：

### CI/CD 任务列表
| 步骤 | 说明 |
|------|------|
| 📥 Checkout code | 检出代码 |
| 🟢 Setup Node.js | 设置 Node.js 环境 |
| 📦 Install dependencies | 安装依赖 |
| 🔍 TypeScript type check | TypeScript 类型检查 |
| 📝 ESLint check | 代码风格检查 |
| 🔨 Build project | 构建项目 |
| ✅ Upload build artifacts | 上传构建产物 |

### 查看 CI/CD 结果
访问：https://github.com/fengfanM/doggo-game/actions

---

## 💻 开发指南

### 代码检查与格式化
```bash
# TypeScript 类型检查
npm run typecheck

# ESLint 代码检查
npm run lint

# ESLint 自动修复
npm run lint:fix

# 运行测试
npm run test
```

### 添加新关卡
修改 `src/data/levels.ts`：
```typescript
const levelConfig = [
  // ... 现有关卡
  {
    types: 10,        // 卡牌种类数
    cardsPerType: 12, // 每种卡牌数量（必须是 3 的倍数）
    layers: 6,        // 层数
    layerOffset: 30   // 层偏移（像素）
  }
];
```

### 添加新卡牌
修改 `src/utils/game.ts` 中的 `DOG_EMOJIS` 数组：
```typescript
export const DOG_EMOJIS = [
  '🐕', '🐶', '🐩', '🦮', '🐕‍🦺',
  // ... 添加更多 emoji
];
```

### 修改音效
修改 `src/utils/sound.ts`：
```typescript
export const playSound = (type: SoundType) => {
  // 自定义音效逻辑
};
```

---

## 📄 许可证

MIT License

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📞 联系方式

- GitHub: https://github.com/fengfanM/doggo-game

---

**祝游戏愉快！🎉**
