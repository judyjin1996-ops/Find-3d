# 🎨 Find 3D - 三维素材搜索平台

<div align="center">

![Find 3D Logo](https://img.shields.io/badge/Find%203D-v2.0.0-blue?style=for-the-badge&logo=3d&logoColor=white)

**专为三维设计师打造的智能素材搜索平台**

[![GitHub Stars](https://img.shields.io/github/stars/judyjin1996-ops/Find-3d?style=social)](https://github.com/judyjin1996-ops/Find-3d)
[![GitHub Forks](https://img.shields.io/github/forks/judyjin1996-ops/Find-3d?style=social)](https://github.com/judyjin1996-ops/Find-3d)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/judyjin1996-ops/Find-3d/actions)

[🌐 在线体验](https://judyjin1996-ops.github.io/Find-3d/) | [📖 使用指南](./使用指南.md) | [🚀 部署指南](./DEPLOYMENT_GUIDE.md) | [🐛 问题反馈](https://github.com/judyjin1996-ops/Find-3d/issues)

</div>

## 🌟 在线演示

- **GitHub Pages**: [https://judyjin1996-ops.github.io/Find-3d/](https://judyjin1996-ops.github.io/Find-3d/)
- **项目仓库**: [https://github.com/judyjin1996-ops/Find-3d](https://github.com/judyjin1996-ops/Find-3d)

## 📋 项目简介

Find 3D是一个现代化的3D素材搜索平台，旨在为三维设计师提供便捷的多网站聚合搜索体验。通过统一的界面，用户可以同时搜索多个知名3D素材网站，快速找到所需的模型、贴图和场景文件。

## ✨ 核心功能

### 🔍 多网站搜索
- **魔顿网** - 高质量3D模型资源
- **CG资源网** - 丰富的免费素材
- **书生CG资源站** - 专业级3D资源

### 🎯 统一结果展示
- 标准化的卡片式布局
- 预览图、价格、免费状态一目了然
- 智能分类和筛选功能

### ⚙️ 灵活配置
- 自定义搜索源网站
- 个性化显示字段设置
- 搜索历史和收藏功能

### 📱 响应式设计
- 完美适配桌面、平板、手机
- 现代化的用户界面
- 流畅的交互动画

## 🚀 快速开始

### 在线使用
直接访问在线版本，无需安装：
- [Netlify版本](https://你的项目名.netlify.app) - 推荐
- [GitHub Pages版本](https://你的用户名.github.io/find-3d)

### 本地运行

```bash
# 克隆项目
git clone https://github.com/judyjin1996-ops/Find-3d.git

# 进入项目目录
cd Find-3d

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 生产环境部署
chmod +x scripts/deploy-production.sh
./scripts/deploy-production.sh
```

## 🛠️ 技术栈

- **前端框架**: React 19 + TypeScript
- **构建工具**: Vite 7
- **样式方案**: Tailwind CSS 4
- **部署平台**: Netlify + GitHub Pages
- **开发工具**: ESLint + PostCSS

## 📁 项目结构

```
find-3d/
├── src/                    # React应用源码
│   ├── components/         # 组件库
│   │   ├── search/        # 搜索相关组件
│   │   ├── results/       # 结果展示组件
│   │   ├── ui/           # 通用UI组件
│   │   └── website-manager/ # 网站管理组件
│   ├── hooks/             # 自定义Hooks
│   ├── services/          # 业务逻辑服务
│   ├── types/             # TypeScript类型定义
│   └── utils/             # 工具函数
├── dist/                  # 构建输出（静态版本）
├── public/                # 静态资源
└── docs/                  # 项目文档
```

## 🎮 使用指南

### 基础搜索
1. 在搜索框输入关键词（如"日本建筑"）
2. 点击搜索按钮或按回车键
3. 查看来自多个网站的搜索结果

### 查看详情
1. 点击任意搜索结果卡片
2. 在弹出的详情框中查看完整信息
3. 点击"查看原页面"访问素材源网站

### 网站管理
1. 点击设置按钮进入网站管理
2. 添加、编辑或删除搜索源网站
3. 自定义显示字段和搜索参数

## 🔧 部署指南

### Netlify部署
1. Fork本项目到你的GitHub账户
2. 在Netlify中连接你的GitHub仓库
3. 设置构建配置：
   - Build command: `npm run build`
   - Publish directory: `dist`
4. 点击部署

### GitHub Pages部署
1. 在仓库设置中启用GitHub Pages
2. 选择部署分支为`main`
3. 设置部署目录为`/dist`
4. 等待自动部署完成

详细部署指南请参考：[部署文档](./DEPLOYMENT_GUIDE.md)

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

### 开发流程
1. Fork项目并创建功能分支
2. 进行开发并添加测试
3. 确保代码通过ESLint检查
4. 提交Pull Request

### 代码规范
- 使用TypeScript进行类型检查
- 遵循ESLint配置的代码风格
- 组件使用函数式组件 + Hooks
- 提交信息使用约定式提交格式

## 📄 许可证

本项目采用 [MIT许可证](./LICENSE)

## 🙏 致谢

- [React](https://reactjs.org/) - 用户界面库
- [Vite](https://vitejs.dev/) - 现代化构建工具
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的CSS框架
- [Netlify](https://netlify.com/) - 静态网站部署平台

## 📞 联系方式

- **项目地址**: [GitHub仓库](https://github.com/judyjin1996-ops/Find-3d)
- **问题反馈**: [Issues页面](https://github.com/judyjin1996-ops/Find-3d/issues)
- **功能建议**: [Discussions页面](https://github.com/judyjin1996-ops/Find-3d/discussions)
- **邮箱联系**: [judyjin1996.ops@gmail.com](mailto:judyjin1996.ops@gmail.com)

---

<div align="center">

**如果这个项目对你有帮助，请给我们一个 ⭐ Star！**

🔗 **快速链接**: [在线演示](https://judyjin1996-ops.github.io/Find-3d/) | [使用文档](./使用指南.md) | [部署指南](./DEPLOYMENT_GUIDE.md)

Made with ❤️ by [judyjin1996-ops](https://github.com/judyjin1996-ops)

</div>