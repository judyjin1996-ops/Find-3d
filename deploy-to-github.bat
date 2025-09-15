@echo off
chcp 65001 >nul
echo 🚀 开始部署Find 3D项目到GitHub...
echo.

REM 检查是否在正确的目录
if not exist "package.json" (
    echo ❌ 错误：请在项目根目录运行此脚本
    pause
    exit /b 1
)

REM 检查Git是否已初始化
if not exist ".git" (
    echo 📁 初始化Git仓库...
    git init
)

REM 添加所有文件
echo 📝 添加项目文件...
git add .

REM 提交更改
echo 💾 提交更改...
git commit -m "🎨 部署Find 3D项目 - %date% %time%"

REM 检查是否已添加远程仓库
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo 🔗 请输入你的GitHub仓库地址 ^(格式: https://github.com/用户名/仓库名.git^):
    set /p repo_url=
    git remote add origin !repo_url!
    echo ✅ 已添加远程仓库: !repo_url!
)

REM 推送到GitHub
echo 🌐 推送到GitHub...
git push -u origin main

echo.
echo 🎉 部署完成！
echo.
echo 📋 下一步操作：
echo 1. 访问你的GitHub仓库页面
echo 2. 进入Settings → Pages
echo 3. 选择部署源为 'main' 分支
echo 4. 等待几分钟后访问你的网站
echo.
echo 🔗 你的网站地址将是：
echo    https://你的用户名.github.io/仓库名/
echo.
echo 💡 提示：如果遇到问题，请查看 'GitHub部署指南.md' 文件
echo.
pause