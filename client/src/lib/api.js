// Тонкий слой над fetch к нашему бэкенду.

async function asError(res) {
  let msg = `Ошибка сервера (${res.status})`
  try {
    const data = await res.json()
    if (data?.error) msg = data.error
  } catch {
    /* тело не JSON — оставляем общее сообщение */
  }
  return new Error(msg)
}

// --- Авторизация ---
export async function getSession() {
  try {
    const res = await fetch('/api/session')
    if (!res.ok) return { required: false, authenticated: true }
    return res.json()
  } catch {
    return { required: false, authenticated: true }
  }
}
export async function login(password) {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  if (!res.ok) throw await asError(res)
  return res.json()
}
export async function logout() {
  await fetch('/api/logout', { method: 'POST' }).catch(() => {})
}

/**
 * Распознаёт одну страницу документа.
 * @param {string} doc — тип страницы (passport_main | passport_names | passport_reg | vehicle)
 * @param {File} file
 * @returns {Promise<object>} извлечённые поля + low_confidence_fields
 */
export async function extractDoc(doc, file) {
  const fd = new FormData()
  fd.append('doc', doc)
  fd.append('image', file)
  const res = await fetch('/api/extract', { method: 'POST', body: fd })
  if (!res.ok) throw await asError(res)
  return res.json()
}

/**
 * Достраивает полный адрес прописки по штампу и органу выдачи паспорта
 * (область + район/город берутся из органа выдачи). Не критично: при ошибке
 * вызывающий код оставляет исходный адрес.
 * @param {string} issuingAuthority орган выдачи (творительный падеж)
 * @param {string} rawAddress распознанный штамп прописки
 * @returns {Promise<string>} полный адрес
 */
export async function composeAddress(issuingAuthority, rawAddress) {
  const res = await fetch('/api/compose-address', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ issuing_authority: issuingAuthority, raw_address: rawAddress }),
  })
  if (!res.ok) throw await asError(res)
  const data = await res.json()
  return data.registration_address_ru || rawAddress
}

/**
 * Разбирает ранее сгенерированный договор комиссии (.docx): характеристики ТС
 * и № / дата договора комиссии (для пайплайна продажи).
 * @param {File} file .docx
 * @returns {Promise<object>}
 */
export async function parseCommission(file) {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch('/api/parse-commission', { method: 'POST', body: fd })
  if (!res.ok) throw await asError(res)
  return res.json()
}

/**
 * Рендерит документ на бэкенде и возвращает Blob (для предпросмотра и скачивания).
 * @param {{passport:object, vehicle:object, manual:object}} state
 * @param {{doc?:'contract'|'act', format?:'docx'|'pdf'}} opts
 * @returns {Promise<{blob:Blob, filename:string}>}
 */
export async function renderContractBlob(state, opts = {}) {
  const { doc = 'contract', format = 'docx' } = opts
  const res = await fetch(`/api/generate?doc=${doc}&format=${format}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state),
  })
  if (!res.ok) throw await asError(res)
  const blob = await res.blob()
  const cd = res.headers.get('Content-Disposition') || ''
  let filename = doc === 'act' ? 'akt.docx' : 'dogovor.docx'
  const star = cd.match(/filename\*=UTF-8''([^;]+)/i) // читаемое имя (может быть кириллицей)
  const plain = cd.match(/filename="?([^";]+)"?/)
  if (star) {
    try {
      filename = decodeURIComponent(star[1])
    } catch {
      if (plain) filename = plain[1]
    }
  } else if (plain) {
    filename = plain[1]
  }
  return { blob, filename }
}

// Инициирует скачивание Blob в браузере.
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
