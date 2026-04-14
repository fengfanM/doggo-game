# 🐕 狗了个狗 - 网页版

这是独立的 H5 网页版本，不会影响原有的微信小程序代码！

---

## 🚀 快速开始

### 方法 1：本地服务器（推荐）

```bash
# 进入 web 目录
cd web

# 启动本地服务器（Python 3）
python3 -m http.server 8080

# 或使用 Python 2
python -m SimpleHTTPServer 8080
```

然后在浏览器中打开：http://localhost:8080

---

### 方法 2：直接打开

直接在浏览器中打开 `web/index.html` 文件。

---

## 📁 文件说明

| 文件 | 说明 |
|------|------|
| `index.html` | 网页入口 |
| `styles.css` | 样式文件 |
| `game.js` | 游戏核心逻辑 |
| `app.js` | 游戏主程序 |

---

## 🎮 功能特性

✅ 完整的 4 个关卡
✅ 撤回功能（2 次）
✅ 洗牌功能（2 次）
✅ 计时器
✅ 分数统计
✅ 关卡选择
✅ 精美的动画效果

---

## 🔧 部署到公网

如果你想让朋友通过公网链接访问，可以：

1. 使用 Vercel、Netlify 等平台部署
2. 使用 GitHub Pages 部署
3. 使用自己的服务器部署

### 部署到 GitHub Pages

```bash
# 将 web/ 目录内容推送到 gh-pages 分支
# 或者使用 GitHub Pages 配置
```

---

## 📝 注意事项

- 此版本是独立的，不会影响原有的微信小程序代码
- 数据存储在浏览器本地（LocalStorage）
- 刷新页面会重置游戏

---

## 🎉 开始游戏！

打开 http://localhost:8080 开始玩吧！
