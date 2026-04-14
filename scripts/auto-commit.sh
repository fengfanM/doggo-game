#!/bin/bash

# 🐕 狗了个狗 - 自动提交推送脚本
# 用法：./scripts/auto-commit.sh "提交信息"

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 获取当前时间
get_timestamp() {
  date "+%Y-%m-%d %H:%M:%S"
}

# 打印带颜色的消息
print_info() {
  echo -e "${BLUE}[INFO]${NC} $(get_timestamp) - $1"
}

print_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $(get_timestamp) - $1"
}

print_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $(get_timestamp) - $1"
}

print_error() {
  echo -e "${RED}[ERROR]${NC} $(get_timestamp) - $1"
}

# 检查 git 是否安装
if ! command -v git &> /dev/null; then
  print_error "Git 未安装，请先安装 Git"
  exit 1
fi

# 检查是否在 git 仓库中
if [ ! -d ".git" ]; then
  print_error "当前目录不是 git 仓库，请先初始化 git"
  exit 1
fi

# 获取提交信息
COMMIT_MSG="$1"
if [ -z "$COMMIT_MSG" ]; then
  print_warning "未提供提交信息，使用默认信息"
  COMMIT_MSG="chore: 自动更新 $(get_timestamp)"
fi

print_info "开始自动提交流程..."
print_info "提交信息: $COMMIT_MSG"

# 1. 检查 git 状态
print_info "检查 git 状态..."
git status

# 2. 添加所有修改的文件
print_info "添加所有修改的文件..."
git add .

# 3. 检查是否有变化需要提交
if git diff --staged --quiet; then
  print_warning "没有检测到文件变化，无需提交"
  exit 0
fi

# 4. 提交
print_info "创建提交..."
git commit -m "$COMMIT_MSG"

# 5. 拉取最新代码（避免冲突）
print_info "拉取远程最新代码..."
git pull --rebase origin main || true

# 6. 推送到远程仓库
print_info "推送到远程仓库..."
git push origin main

print_success "✅ 自动提交推送成功！"
print_success "📦 提交信息: $COMMIT_MSG"
print_success "🌐 远程仓库: $(git remote get-url origin)"
