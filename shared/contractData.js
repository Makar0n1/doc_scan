// Единый источник правды: преобразование редактируемого состояния формы
// в плоский объект плейсхолдеров договора. Используется и фронтом (HTML-предпросмотр),
// и бэком (рендер .docx) — чтобы предпросмотр совпадал с итоговым документом.

// Полный список плейсхолдеров шаблона template.docx (22 шт.).
export const PLACEHOLDER_KEYS = [
  'contract_number', 'contract_date',
  'fio', 'fio_short',
  'identification_number', 'passport_number',
  'issued', 'reg_address',
  'vehicle_type', 'body_type', 'make_model', 'vin', 'color',
  'mileage', 'year', 'reg_number', 'certificate_number', 'cert_line',
  'price', 'price_words', 'commission', 'commission_words',
]

const clean = (v) => (v == null ? '' : String(v).trim())
// Характеристики ТС в договоре идут ЗАГЛАВНЫМИ (как на бланке СРТС).
const upper = (v) => clean(v).toUpperCase()

// Приводит ФИО к виду «Каждое Слово С Заглавной» (учёт дефиса: Анна-Мария).
// Применяется как страховка, если модель вернула значение ЗАГЛАВНЫМИ.
export function titleCaseName(value) {
  return clean(value)
    .toLowerCase()
    .replace(/(^|[\s\-’'])([а-яёa-z])/g, (_, sep, ch) => sep + ch.toUpperCase())
}

// "Штепа К.И." — фамилия + инициалы без пробела между инициалами.
export function shortFio(surname, name, patronymic) {
  const s = titleCaseName(surname)
  const initials = [name, patronymic]
    .map(clean)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + '.')
    .join('')
  return [s, initials].filter(Boolean).join(' ')
}

/**
 * Собирает плоский объект плейсхолдеров из состояния формы.
 * @param {{passport?:object, vehicle?:object, manual?:object}} state
 * @returns {Record<string,string>} все ключи PLACEHOLDER_KEYS, пустые — "" (не undefined)
 */
export function buildContractData(state = {}) {
  const p = state.passport || {}
  const v = state.vehicle || {}
  const m = state.manual || {}

  const fio = [p.surname_ru, p.name_ru, p.patronymic_ru]
    .map(titleCaseName)
    .filter(Boolean)
    .join(' ')

  // Строка «Выдан …»: орган есть → «Выдан <орган> от <дата>»; органа нет → просто «Выдан».
  const auth = clean(p.issuing_authority_ru)
  const issDate = clean(p.date_of_issue)
  const issued = auth ? (issDate ? `Выдан ${auth} от ${issDate}` : `Выдан ${auth}`) : 'Выдан'

  // Свидетельство о регистрации: «№ <номер> от <дата выдачи СРТС>».
  const certNum = clean(v.certificate_number)
  const certDate = clean(v.certificate_date)
  const cert_line = certNum ? (certDate ? `№ ${certNum} от ${certDate}` : `№ ${certNum}`) : ''

  const data = {
    // Ручной ввод
    contract_number: clean(m.contract_number),
    contract_date: clean(m.contract_date),
    mileage: clean(m.mileage),
    price: clean(m.price),
    price_words: clean(m.price_words),
    commission: clean(m.commission),
    commission_words: clean(m.commission_words),

    // Паспорт (комитент)
    fio,
    fio_short: shortFio(p.surname_ru, p.name_ru, p.patronymic_ru),
    identification_number: clean(p.identification_number),
    passport_number: clean(p.passport_number),
    issued,
    reg_address: clean(p.registration_address_ru),

    // СРТС (транспортное средство) — текстовые характеристики ЗАГЛАВНЫМИ
    vehicle_type: upper(v.vehicle_type_ru),
    body_type: upper(v.body_type_ru),
    make_model: upper(v.make_model),
    vin: upper(v.vin),
    color: upper(v.color_ru),
    year: clean(v.year),
    reg_number: upper(v.reg_number),
    certificate_number: upper(v.certificate_number),
    cert_line,
  }

  // Гарантируем, что присутствуют все ключи и нет undefined.
  for (const k of PLACEHOLDER_KEYS) if (data[k] == null) data[k] = ''
  return data
}
