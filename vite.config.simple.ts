import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 简化的构建配置，跳过类型检查
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  esbuild: {
    // 跳过类型检查
    target: 'es2020',
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  }
})