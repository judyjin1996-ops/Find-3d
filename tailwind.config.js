/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // 简笔画风格的颜色配置
      colors: {
        sketch: {
          primary: '#2D3748',
          secondary: '#4A5568',
          accent: '#3182CE',
          background: '#F7FAFC',
          card: '#FFFFFF',
          border: '#E2E8F0',
          text: '#1A202C',
          muted: '#718096'
        }
      },
      // 简笔画风格的字体
      fontFamily: {
        sketch: ['Comic Sans MS', 'cursive', 'sans-serif'],
        mono: ['Courier New', 'monospace']
      },
      // 简笔画风格的圆角
      borderRadius: {
        sketch: '12px',
        'sketch-lg': '16px'
      },
      // 简笔画风格的阴影
      boxShadow: {
        sketch: '2px 2px 8px rgba(0, 0, 0, 0.1)',
        'sketch-lg': '4px 4px 12px rgba(0, 0, 0, 0.15)'
      }
    },
  },
  plugins: [],
}