# Netlify 快速部署指南

## 🚀 拖拽部署，3分钟上线

### 步骤1：构建项目
```bash
# 进入项目目录
cd find-3d

# 安装依赖
npm install

# 构建项目
npm run build
```

### 步骤2：部署到Netlify
1. 访问 [netlify.com](https://netlify.com)
2. 注册账号（可以用邮箱或GitHub）
3. 在首页找到 "Deploy manually" 区域
4. 直接将 `dist` 文件夹拖拽到部署区域
5. 等待几秒钟，部署完成！

### 步骤3：获取网址
- Netlify会给你一个随机网址，格式类似：`https://amazing-name-123456.netlify.app`
- 可以在设置中修改网址名称

### 优势
- ✅ 完全免费
- ✅ 拖拽部署，超级简单
- ✅ 自动HTTPS
- ✅ 全球CDN
- ✅ 可以修改网址名称

## 🎯 更简单的方式：一键部署

如果你有GitHub账号，可以：
1. 将代码上传到GitHub
2. 在Netlify选择 "New site from Git"
3. 连接GitHub仓库
4. 自动部署，以后代码更新会自动重新部署

## 📝 自定义网址

在Netlify控制台：
1. 进入 Site settings
2. 点击 "Change site name"
3. 修改为你想要的名称，如：`find-3d-materials`
4. 最终网址：`https://find-3d-materials.netlify.app`