# Vercel 快速部署指南

## 🚀 5分钟部署到线上

### 步骤1：准备代码
```bash
# 进入项目目录
cd find-3d

# 安装依赖
npm install

# 构建项目
npm run build
```

### 步骤2：部署到Vercel
1. 访问 [vercel.com](https://vercel.com)
2. 点击 "Sign up" 注册账号（可以用GitHub账号登录）
3. 点击 "New Project"
4. 选择 "Import Git Repository"
5. 如果代码在GitHub上，直接导入；如果没有，先上传到GitHub
6. 选择项目后，Vercel会自动检测到这是React项目
7. 点击 "Deploy" 开始部署

### 步骤3：获取网址
- 部署完成后，Vercel会给你一个网址，格式类似：`https://find-3d-xxx.vercel.app`
- 这个网址就可以直接分享给其他人使用了！

### 优势
- ✅ 完全免费
- ✅ 自动HTTPS
- ✅ 全球CDN加速
- ✅ 自动部署（代码更新时自动重新部署）
- ✅ 支持自定义域名

## 🌐 分享给其他人

### 直接分享
将Vercel给你的网址直接发给其他人：
```
https://your-project-name.vercel.app
```

### 二维码分享
可以用任何二维码生成器将网址转成二维码，方便手机扫描访问。

### 用户使用说明
告诉用户：
1. 直接点击链接即可使用
2. 无需注册或登录
3. 支持手机、平板、电脑访问
4. 搜索历史会保存在他们的浏览器中
5. 可以添加到手机桌面快捷方式

## 🔧 如果没有GitHub账号

### 方案A：创建GitHub账号（推荐）
1. 访问 [github.com](https://github.com) 注册账号
2. 创建新仓库，上传find-3d项目代码
3. 然后按上面步骤用Vercel部署

### 方案B：直接上传文件到Vercel
1. 先在本地运行 `npm run build`
2. 将生成的 `dist` 文件夹压缩成zip
3. 在Vercel选择 "Deploy from ZIP"
4. 上传zip文件即可

## 📱 移动端优化

项目已经做了移动端优化：
- 响应式设计，自动适配手机屏幕
- 触摸友好的界面
- 移动端搜索体验优化

## 🆘 常见问题

### Q: 部署后网站打不开？
A: 等待1-2分钟，Vercel需要时间构建和部署

### Q: 可以修改网址吗？
A: 可以在Vercel项目设置中修改项目名称，或者绑定自定义域名

### Q: 用户数据会丢失吗？
A: 不会，用户的搜索历史和配置都保存在他们自己的浏览器中

### Q: 需要付费吗？
A: Vercel的免费套餐完全够用，支持无限制的个人项目