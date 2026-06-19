import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import tailwindConfig from './tailwind.config.js'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))

// Backend-порт берём из окружения, чтобы dev-прокси совпадал с реальным портом сервера.
const BACKEND_PORT = process.env.PORT || 3000

export default defineConfig({
  root: 'client',
  plugins: [react()],
  // PostCSS-конфиг задаём инлайн — так не зависим от того, откуда Vite ищет postcss.config.
  css: {
    postcss: {
      plugins: [tailwindcss(tailwindConfig), autoprefixer()],
    },
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    host: true, // слушать на всех интерфейсах — доступ с телефона по IP в локальной сети
    // Разрешаем dev-серверу читать общий код из ../shared (вне client-рута).
    fs: { allow: [projectRoot] },
    // Запросы /api в dev проксируем на Express-бэкенд.
    proxy: {
      '/api': `http://localhost:${BACKEND_PORT}`,
    },
  },
})
