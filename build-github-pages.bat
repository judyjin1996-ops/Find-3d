@echo off
chcp 65001 >nul
echo 🚀 开始为GitHub Pages构建项目...

REM 设置环境变量
set NODE_ENV=production

REM 清理旧的构建文件
if exist dist rmdir /s /q dist

REM 构建项目
npm run build

REM 复制dist内容到根目录
xcopy dist\* . /E /Y

REM 检查入口文件
if not exist "index.html" (
    echo ❌ 构建失败：缺少index.html文件
    pause
    exit /b 1
)

echo ✅ GitHub Pages构建完成！
echo 📋 下一步：
echo 1. 提交所有更改到GitHub
echo 2. 在GitHub仓库设置中启用Pages
echo 3. 选择部署源为 'main' 分支的根目录
echo 4. 等待几分钟后访问: https://judyjin1996-ops.github.io/Find-3d/
pause