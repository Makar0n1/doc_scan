// Сохранение состояния мастера в localStorage — переживает перезагрузку страницы.
// Сбрасывается только при «Создать новый договор».

const KEY = 'avto-komissiya:state:v2'

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // Переполнение квоты (например, тяжёлые фото) — игнорируем, данные полей важнее.
  }
}

export function clearState() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* no-op */
  }
}
