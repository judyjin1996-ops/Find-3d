@echo off
chcp 65001 >nul

echo 🚀 Find 3D 一键部署脚本
echo ==========================

REM 检查Node.js是否安装
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误：未找到Node.js，请先安装Node.js
    echo    下载地址：https://nodejs.org/
    pause
    exit /b 1
)

REM 检查npm是否安装
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误：未找到npm
    pause
    exit /b 1
)

echo ✅ Node.js和npm已安装

REM 安装依赖
echo 📦 安装项目依赖...
npm install
if %errorlevel% neq 0 (
    echo ❌ 依赖安装失败
    pause
    exit /b 1
)

echo ✅ 依赖安装完成

REM 构建项目
echo 🔨 构建项目...
npm run build
if %errorlevel% neq 0 (
    echo ❌ 项目构建失败
    pause
    exit /b 1
)

echo ✅ 项目构建完成

REM 检查dist目录
if not exist "dist" (
    echo ❌ 构建失败：未找到dist目录
    pause
    exit /b 1
)

echo 📁 构建文件已生成在 dist\ 目录
echo.
echo 🎉 项目准备完成！
echo.
echo 📋 接下来选择部署方式：
echo 1. Vercel（推荐）：
echo    - 访问 https://vercel.com
echo    - 注册账号并创建新项目
echo    - 上传整个项目文件夹或连接GitHub
echo.
echo 2. Netlify：
echo    - 访问 https://netlify.com
echo    - 将 dist\ 文件夹拖拽到部署区域
echo.
echo 3. 本地预览：
echo    - 运行：npm run preview
echo    - 在浏览器打开显示的地址
echo.
echo 📱 部署完成后，你将获得一个网址，可以直接分享给其他人使用！
echo.
pause