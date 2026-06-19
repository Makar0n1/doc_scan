import sharp from 'sharp'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
// Модель распознавания. Меняется через переменную окружения OPENROUTER_MODEL
// без правки кода. По умолчанию — флагманский Qwen3.5 VL (меньше галлюцинирует,
// чем 32B). Альтернативы: google/gemini-3-pro-preview (лучший OCR по рукописи),
// google/gemini-3-flash-preview (дешевле), anthropic/claude-sonnet-4.6.
const MODEL = process.env.OPENROUTER_MODEL || 'qwen/qwen3.5-397b-a17b'
const MAX_SIDE = 1500 // даунскейл длинной стороны перед отправкой в модель

/**
 * Сжимает изображение (sharp) и возвращает base64 data URL.
 * Даунскейл до ~1500px по длинной стороне, перекодировка в JPEG.
 * @param {Buffer} buffer
 * @returns {Promise<string>} data:image/jpeg;base64,...
 */
async function toDataUrl(buffer) {
  const out = await sharp(buffer)
    .rotate() // учесть EXIF-ориентацию (фото с телефона)
    .resize(MAX_SIDE, MAX_SIDE, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toBuffer()
  return `data:image/jpeg;base64,${out.toString('base64')}`
}

// Вырезаем JSON из ответа модели (на случай ```json ...``` или лишнего текста вокруг).
function parseModelJson(content) {
  if (!content) throw new Error('Пустой ответ модели')
  let text = content.trim()
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) text = fence[1].trim()
  // Берём от первой { до последней } включительно.
  const first = text.indexOf('{')
  const last = text.lastIndexOf('}')
  if (first !== -1 && last !== -1) text = text.slice(first, last + 1)
  return JSON.parse(text)
}

/**
 * Один вызов модели: системный промпт + N изображений. Парсит JSON,
 * при ошибке парсинга повторяет запрос один раз, затем бросает ошибку.
 * @param {string} systemPrompt
 * @param {Buffer[]} buffers — изображения (1 для СРТС, 2 для паспорта)
 * @returns {Promise<object>}
 */
export async function extractWithModel(systemPrompt, buffers) {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('Не задан OPENROUTER_API_KEY')

  const dataUrls = await Promise.all(buffers.map(toDataUrl))
  const userContent = [
    { type: 'text', text: 'Извлеки данные из документа по схеме. Верни только JSON.' },
    ...dataUrls.map((url) => ({ type: 'image_url', image_url: { url } })),
  ]

  const body = {
    model: MODEL,
    temperature: 0,
    // Запрет провайдеру собирать/логировать данные запроса.
    provider: { data_collection: 'deny' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
  }

  // Один вызов сети; парсинг с одним повтором.
  async function callOnce() {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      // Не логируем тело (может содержать эхо данных) — только статус.
      throw new Error(`OpenRouter вернул статус ${res.status}`)
    }
    const json = await res.json()
    return json?.choices?.[0]?.message?.content
  }

  let lastErr
  for (let attempt = 0; attempt < 2; attempt++) {
    const content = await callOnce()
    try {
      return parseModelJson(content)
    } catch (e) {
      lastErr = e
    }
  }
  throw new Error('Не удалось разобрать JSON-ответ модели после повторной попытки')
}
