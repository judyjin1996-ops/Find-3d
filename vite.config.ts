import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync } from 'fs'
import { resolve } from 'path'

// 自定义插件：复制production.html到dist目录
const copyProductionHtml = () => {
  return {
    name: 'copy-production-html',
    writeBundle() {
      try {
        copyFileSync(
          resolve(__dirname, 'production.html'),
          resolve(__dirname, 'dist/production.html')
        )
        console.log('✅ production.html 已复制到 dist 目录')
      } catch (error: any) {
        console.warn('⚠️ 复制 production.html 失败:', error?.message || error)
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), copyProductionHtml()],
  // 根据部署平台设置base路径
  // GitHub Pages部署配置 - 修复空白页问题
  base: process.env.NODE_ENV === 'production' ? '/Find-3d/' : '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    // 确保构建输出干净
    emptyOutDir: true,
    // 确保生成正确的入口文件
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  // 开发服务器配置
  server: {
    port: 3000,
    open: true
  }
})
