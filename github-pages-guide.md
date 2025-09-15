# GitHub Pages 部署指南

## 🚀 免费托管在GitHub

### 前提条件
- 需要GitHub账号
- 代码需要上传到GitHub仓库

### 步骤1：准备GitHub仓库
```bash
# 如果还没有仓库，创建并上传代码
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用户名/find-3d.git
git push -u origin main
```

### 步骤2：配置GitHub Pages
1. 在GitHub仓库页面，点击 "Settings"
2. 滚动到 "Pages" 部分
3. 在 "Source" 下选择 "GitHub Actions"
4. 创建部署工作流

### 步骤3：创建自动部署配置
创建文件 `.github/workflows/deploy.yml`：

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
      
    - name: Build
      run: npm run build
      
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

### 步骤4：获取网址
- 部署完成后，网址格式：`https://你的用户名.github.io/find-3d`
- 在仓库Settings > Pages中可以看到确切网址

### 优势
- ✅ 完全免费
- ✅ 与GitHub集成
- ✅ 自动部署
- ✅ 支持自定义域名