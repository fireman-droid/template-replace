import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        silenceDeprecations: ['legacy-js-api', 'global-builtin', 'color-functions', 'import']
      }
    }
  },
  server: {
    port: 3001,
    strictPort: false,
    allowedHosts: true, // 允许所有 ngrok 等内网穿透域名访问
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',  // 开发环境连接本地后端
        changeOrigin: true
      }
    }
  }
})
