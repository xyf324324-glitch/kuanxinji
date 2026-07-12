import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['kuanxin-logo.png', 'favicon.svg'],
      manifest: {
        name: '宽心纪｜愿您宽心',
        short_name: '宽心纪',
        description: '文章、经典与节气内容的离线阅读空间。',
        theme_color: '#f8f6f1',
        background_color: '#f8f6f1',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/#/',
        scope: '/',
        lang: 'zh-CN',
        categories: ['books', 'lifestyle'],
        icons: [
          {
            src: '/kuanxin-logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,png,jpg,jpeg,svg,json,webmanifest}'],
      },
    }),
  ],
})
