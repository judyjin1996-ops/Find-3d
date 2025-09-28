import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// 简化的Vite配置，用于快速构建
export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@services': path.resolve(__dirname, './src/services'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      '@crawler': path.resolve(__dirname, './src/crawler'),
    },
  },
  
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: false, // 禁用压缩以避免terser问题
    rollupOptions: {
      external: [
        // 排除Node.js模块
        'fs', 'path', 'os', 'crypto', 'http', 'https', 'net', 'tls', 'url', 'util', 'stream', 'events', 'buffer',
        'node:fs', 'node:path', 'node:os', 'node:crypto', 'node:http', 'node:https', 'node:net', 'node:tls', 'node:url', 'node:util', 'node:stream', 'node:events', 'node:buffer',
        'puppeteer', 'cheerio', 'sharp', 'node-cache', 'proxy-agent', 'user-agents'
      ],
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
  
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __IS_PRODUCTION__: JSON.stringify(true),
  },
  
  server: {
    port: 3000,
    open: true,
  },
  
  preview: {
    port: 4173,
  },
})