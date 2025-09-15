# 🚀 快速部署指南

## 最简单的部署方式

### 方法1：一键脚本（推荐）

**Mac/Linux用户：**
```bash
cd find-3d
./scripts/deploy.sh
```

**Windows用户：**
```cmd
cd find-3d
scripts\deploy.bat
```

### 方法2：手动部署

1. **构建项目**
   ```bash
   cd find-3d
   npm install
   npm run build
   ```

2. **选择部署平台**
   - **Vercel**（推荐）：访问 [vercel.com](https://vercel.com)，上传项目
   - **Netlify**：访问 [netlify.com](https://netlify.com)，拖拽 `dist` 文件夹
   - **GitHub Pages**：上传到GitHub，启用Pages功能

## 🌐 分享给其他人

部署完成后，你会得到一个网址，例如：
- `https://find-3d-xxx.vercel.app`
- `https://amazing-name.netlify.app`
- `https://username.github.io/find-3d`

**直接将这个网址发给其他人即可！**

## 📱 用户使用说明

告诉用户：
1. 📱 **支持所有设备**：手机、平板、电脑都能用
2. 🔍 **直接搜索**：输入关键词即可搜索3D素材
3. 💾 **自动保存**：搜索历史会保存在浏览器中
4. ⚙️ **可自定义**：可以添加新的搜索网站
5. 🆓 **完全免费**：无需注册，直接使用

## 🎯 功能特色

- ✅ 同时搜索多个3D素材网站
- ✅ 简洁的简笔画风格界面
- ✅ 智能搜索历史管理
- ✅ 自定义显示字段
- ✅ 移动端完美适配
- ✅ 快速预览和跳转

## 🆘 需要帮助？

如果遇到问题：
1. 查看详细部署指南：`vercel-deploy-guide.md`
2. 检查项目是否正确构建：运行 `npm run preview` 本地测试
3. 确保网络连接正常

---

**🎉 恭喜！你的3D素材搜索网站即将上线！**