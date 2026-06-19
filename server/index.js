import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import express from 'express'
import multer from 'multer'
import { extractWithModel } from './services/openrouter.js'
import { renderDoc } from './services/docx.js'
import { convertDocxToPdf } from './services/pdf.js'
import { buildPrompt, DOC_TYPES } from './prompts.js'
import {
  requireAuth, authEnabled, passwordValid, signSession,
  sessionCookie, clearСookieHeader, verifySession, parseCookies, COOKIE_NAME,
} from './auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3000
const isProd = process.env.NODE_ENV === 'production'

const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '1mb' }))

// --- Технический лог без PII: метод, путь, статус, длительность (никаких тел/данных) ---
app.use((req, res, next) => {
  const start = process.hrtime.bigint()
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6
    console.log(`${req.method} ${req.path} ${res.statusCode} ${ms.toFixed(0)}ms`)
  })
  next()
})

// --- Авторизация (общий пароль, долгоживущая подписанная cookie) ---
app.get('/api/session', (req, res) => {
  res.json({
    required: authEnabled(),
    authenticated: !authEnabled() || verifySession(parseCookies(req)[COOKIE_NAME]),
  })
})
app.post('/api/login', (req, res) => {
  if (!authEnabled()) return res.json({ ok: true })
  if (passwordValid(req.body?.password)) {
    res.setHeader('Set-Cookie', sessionCookie(signSession(), isProd))
    return res.json({ ok: true })
  }
  res.status(401).json({ error: 'Неверный пароль.' })
})
app.post('/api/logout', (req, res) => {
  res.setHeader('Set-Cookie', clearСookieHeader(isProd))
  res.json({ ok: true })
})

// --- Загрузка файлов: только в память, лимит 10 МБ, только изображения ---
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) cb(null, true)
    else {
      const e = new Error('Допускаются только изображения')
      e.status = 400
      cb(e)
    }
  },
})

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

/**
 * POST /api/extract
 * Поле файла: image. Поле тела: doc (тип страницы — см. DOC_TYPES).
 * Один запрос к модели на одну страницу с профильной схемой.
 */
app.post(
  '/api/extract',
  requireAuth,
  upload.single('image'),
  wrap(async (req, res) => {
    const doc = req.body?.doc
    const file = req.file
    if (!DOC_TYPES.includes(doc)) {
      return res.status(400).json({ error: 'Неизвестный тип страницы.' })
    }
    if (!file) {
      return res.status(400).json({ error: 'Не получено изображение.' })
    }

    const result = await extractWithModel(buildPrompt(doc), [file.buffer])

    // Обнуляем буфер изображения сразу после использования.
    file.buffer = null

    res.json(result)
  })
)

/**
 * POST /api/generate?doc=contract|act&format=docx|pdf
 * Тело: { passport, vehicle, manual } — собранное состояние формы.
 * Рендерит документ в памяти и отдаёт на скачивание. PDF — через LibreOffice.
 */
app.post(
  '/api/generate',
  requireAuth,
  wrap(async (req, res) => {
    const state = req.body || {}
    const which = req.query.doc === 'act' ? 'act' : 'contract'
    const pdf = req.query.format === 'pdf'

    let buffer = renderDoc(which, state)
    if (pdf) buffer = await convertDocxToPdf(buffer)

    const num = String(state?.manual?.contract_number || '').replace(/[^\dA-Za-zА-Яа-я-]/g, '') || 'bez-nomera'
    const base = which === 'act' ? 'akt' : 'dogovor'
    const ext = pdf ? 'pdf' : 'docx'
    const type = pdf
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

    res.setHeader('Content-Type', type)
    res.setHeader('Content-Disposition', `attachment; filename="${base}-${num}.${ext}"`)
    res.setHeader('Content-Length', buffer.length)
    res.end(buffer)
    buffer = null // помогаем сборщику мусора — документ не задерживается в памяти
  })
)

// --- Прод: отдаём собранный фронт как статику + SPA-fallback ---
if (isProd) {
  const distDir = path.resolve(__dirname, '../dist')
  app.use(express.static(distDir))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next()
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

// --- Единый обработчик ошибок: понятные сообщения на русском, без PII в логах ---
app.use((err, _req, res, _next) => {
  // Логируем только сообщение об ошибке (без тел запросов/данных).
  console.error('Ошибка:', err.message)
  if (err instanceof multer.MulterError) {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'Файл превышает лимит 10 МБ.' : 'Ошибка загрузки файла.'
    return res.status(400).json({ error: msg })
  }
  res.status(err.status || 500).json({ error: err.message || 'Внутренняя ошибка сервера.' })
})

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}${isProd ? ' (production)' : ' (dev)'}`)
})
