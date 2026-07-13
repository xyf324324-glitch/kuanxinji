import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { fileURLToPath } from 'node:url'
import { readFileSync, writeFileSync } from 'node:fs'

const logoDataUrl = `data:image/png;base64,${readFileSync(
  fileURLToPath(new URL('./public/kuanxin-logo.png', import.meta.url)),
).toString('base64')}`

// A portable build for simple static hosts such as GitHub Pages.
// PWA is deliberately omitted: a service worker cannot be embedded in HTML.
export default defineConfig({
  base: './',
  publicDir: false,
  resolve: {
    alias: {
      'virtual:pwa-register': fileURLToPath(new URL('./scripts/single-pwa-register-stub.js', import.meta.url)),
    },
  },
  build: {
    // GitHub Pages can publish this folder directly from the main branch.
    outDir: 'docs',
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: Number.POSITIVE_INFINITY,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
  plugins: [
    react(),
    {
      name: 'inline-public-logo',
      transformIndexHtml(html) {
        return html.replaceAll('/kuanxin-logo.png', logoDataUrl)
      },
    },
    viteSingleFile(),
    {
      name: 'github-pages-nojekyll',
      closeBundle() {
        writeFileSync(fileURLToPath(new URL('./docs/.nojekyll', import.meta.url)), '')
      },
    },
  ],
})
