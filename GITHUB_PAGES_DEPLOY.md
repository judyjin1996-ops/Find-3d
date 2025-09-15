# GitHub Pages 部署指南

## 🚀 使用GitHub自动构建和部署Find 3D项目

### 方法一：GitHub Actions 自动部署（推荐）

#### 1. 创建GitHub仓库
```bash
# 在find-3d目录下初始化git仓库
cd find-3d
git init
git add .
git commit -m "Initial commit: Find 3D project"

# 在GitHub上创建新仓库，然后关联
git remote add origin https://github.com/你的用户名/find-3d.git
git branch -M main
git push -u origin main
```

#### 2. 创建GitHub Actions工作流

创建 `.github/workflows/deploy.yml` 文件：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build project
      run: npm run build
      
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      if: github.ref == 'refs/heads/main'
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

#### 3. 配置GitHub Pages
1. 进入GitHub仓库设置页面
2. 找到 "Pages" 选项
3. Source 选择 "Deploy from a branch"
4. Branch 选择 "gh-pages"
5. 点击 "Save"

#### 4. 推送代码触发部署
```bash
git add .
git commit -m "Add GitHub Actions workflow"
git push
```

### 方法二：手动构建上传

#### 1. 本地构建
```bash
cd find-3d
npm run build
```

#### 2. 创建gh-pages分支
```bash
# 创建并切换到gh-pages分支
git checkout --orphan gh-pages

# 清空工作区
git rm -rf .

# 复制dist目录内容到根目录
cp -r dist/* .
cp dist/.* . 2>/dev/null || true

# 添加并提交
git add .
git commit -m "Deploy to GitHub Pages"

# 推送到GitHub
git push origin gh-pages

# 切换回main分支
git checkout main
```

### 方法三：使用gh-pages包自动化

#### 1. 安装gh-pages包
```bash
npm install --save-dev gh-pages
```

#### 2. 更新package.json
```json
{
  "scripts": {
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

#### 3. 部署
```bash
npm run deploy
```

## 🔧 Vite配置优化

为了确保在GitHub Pages上正常工作，需要配置正确的base路径：

### 更新 `vite.config.ts`：
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/find-3d/' : '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
})
```

### 更新 `package.json` 构建脚本：
```json
{
  "scripts": {
    "build": "tsc -b && vite build && node fix-deployment.js",
    "build:github": "NODE_ENV=production npm run build"
  }
}
```

## 📝 完整的GitHub Actions工作流

创建 `.github/workflows/deploy.yml`：

```yaml
name: Build and Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build project
        run: |
          NODE_ENV=production npm run build
          
      - name: Setup Pages
        uses: actions/configure-pages@v4
        
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## 🌐 访问你的网站

部署成功后，你的网站将在以下地址可用：
```
https://你的用户名.github.io/find-3d/
```

## 🔍 故障排除

### 1. 构建失败
检查GitHub Actions日志：
- 进入仓库的 "Actions" 标签页
- 点击失败的工作流查看详细日志

### 2. 页面显示404
- 确保GitHub Pages设置正确
- 检查分支名称是否为 `gh-pages`
- 确保 `index.html` 在根目录

### 3. 资源加载失败
- 检查 `vite.config.ts` 中的 `base` 配置
- 确保所有资源路径都是相对路径

### 4. 路由问题（SPA）
GitHub Pages默认不支持SPA路由，需要：
- 确保 `_redirects` 文件在dist目录中
- 或者创建 `404.html` 文件重定向到 `index.html`

## 📋 部署检查清单

- [ ] 创建GitHub仓库
- [ ] 配置GitHub Actions工作流
- [ ] 更新Vite配置的base路径
- [ ] 推送代码到main分支
- [ ] 在GitHub设置中启用Pages
- [ ] 等待Actions构建完成
- [ ] 访问生成的URL验证部署

## 🎯 自定义域名（可选）

如果你有自己的域名：

1. 在仓库根目录创建 `CNAME` 文件：
```
your-domain.com
```

2. 在域名DNS设置中添加CNAME记录：
```
CNAME  www  你的用户名.github.io
```

3. 在GitHub Pages设置中配置自定义域名

## 🔄 自动更新

每次推送到main分支时，GitHub Actions会自动：
1. 安装依赖
2. 构建项目
3. 运行修复脚本
4. 部署到GitHub Pages

这样你就有了一个完全自动化的部署流程！🎉