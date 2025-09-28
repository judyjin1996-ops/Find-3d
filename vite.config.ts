import { defineConfig, loadEnv } from 'vite'
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
export default defineConfig(({ command, mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')
  const isProduction = mode === 'production'
  
  return {
    plugins: [react(), copyProductionHtml()],
    
    // 路径解析
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@components': resolve(__dirname, 'src/components'),
        '@services': resolve(__dirname, 'src/services'),
        '@utils': resolve(__dirname, 'src/utils'),
        '@types': resolve(__dirname, 'src/types'),
        '@crawler': resolve(__dirname, 'src/crawler')
      }
    },
    
    // 根据部署平台设置base路径
    base: isProduction ? '/Find-3d/' : '/',
    
    // 构建配置
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: !isProduction,
      minify: isProduction ? 'terser' : false,
      emptyOutDir: true,
      
      // 代码分割优化
      rollupOptions: {
        input: {
          main: './index.html'
        },
        output: {
          manualChunks: isProduction ? {
            // 将React相关库分离
            'react-vendor': ['react', 'react-dom'],
            // 将爬虫相关代码分离（如果存在）
            'crawler': [
              './src/services/crawlerService',
              './src/services/searchService'
            ],
            // 将UI组件分离
            'ui-components': [
              './src/components/ui/Button',
              './src/components/ui/Card',
              './src/components/ui/Modal',
              './src/components/ui/Loading'
            ]
          } : undefined
        }
      },
      
      // Terser配置（生产环境压缩）
      terserOptions: isProduction ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info']
        },
        mangle: {
          safari10: true
        }
      } : undefined,
      
      // 构建目标
      target: 'es2015',
      
      // CSS代码分割
      cssCodeSplit: true,
      
      // 资源处理
      assetsInlineLimit: 4096
    },
    
    // 开发服务器配置
    server: {
      port: 3000,
      host: true,
      open: true,
      cors: true,
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:8080',
          changeOrigin: true,
          secure: false
        }
      }
    },
    
    // 预览配置（用于生产构建预览）
    preview: {
      port: 4173,
      host: true,
      cors: true
    },
    
    // 环境变量
    define: {
      __APP_VERSION__: JSON.stringify(env.VITE_APP_VERSION || '2.0.0'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __IS_PRODUCTION__: JSON.stringify(isProduction)
    },
    
    // 优化配置
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom'
      ],
      exclude: [
        'puppeteer'
      ]
    },
    
    // CSS配置
    css: {
      modules: {
        localsConvention: 'camelCase'
      }
    }
  }
})
