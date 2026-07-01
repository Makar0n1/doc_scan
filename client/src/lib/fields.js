// Конфигурация мастера: шаги, загрузка 5 фото, страницы проверки, поля, сборка данных.

// VIN: ровно 17 символов, латиница+цифры, без I, O, Q.
export const VIN_RE = /^[A-HJ-NPR-Z0-9]{17}$/
export function vinValid(v) {
  return VIN_RE.test(String(v || '').toUpperCase())
}

export const NAME_FIELDS = ['surname_ru', 'name_ru', 'patronymic_ru']
export const VEHICLE_UPPER_FIELDS = ['vehicle_type_ru', 'body_type_ru', 'make_model', 'color_ru']

// 5 загружаемых страниц.
export const DOC_IDS = ['passport_main', 'passport_names', 'passport_reg', 'vehicle_front', 'vehicle_back']

// Слоты загрузки (шаг 1).
export const UPLOAD_SLOTS = [
  { id: 'passport_main', title: 'Паспорт — страница с фото', hint: 'фото и MRZ' },
  { id: 'passport_names', title: 'Паспорт — разворот с ФИО', hint: 'ФИО, орган выдачи' },
  { id: 'passport_reg', title: 'Паспорт — страница с пропиской', hint: 'штамп регистрации' },
  { id: 'vehicle_front', title: 'Тех. паспорт — лицевая', hint: 'характеристики ТС' },
  { id: 'vehicle_back', title: 'Тех. паспорт — оборотная', hint: 'владелец и адрес' },
]

// Метаданные полей (подпись, плейсхолдер, ширина).
const F = {
  identification_number: { label: 'Идентификационный номер' },
  passport_number: { label: 'Номер паспорта' },
  date_of_issue: { label: 'Дата выдачи', placeholder: 'ДД.ММ.ГГГГ' },
  surname_ru: { label: 'Фамилия' },
  name_ru: { label: 'Имя' },
  patronymic_ru: { label: 'Отчество' },
  issuing_authority_ru: { label: 'Кем выдан (Выдан …)', full: true, placeholder: 'если разворота паспорта нет — оставьте пустым, впишете вручную' },
  make_model: { label: 'Марка и модель' },
  vin: { label: 'VIN' },
  reg_number: { label: 'Регистрационный номер' },
  year: { label: 'Год выпуска' },
  color_ru: { label: 'Цвет' },
  vehicle_type_ru: { label: 'Тип ТС' },
  body_type_ru: { label: 'Тип кузова' },
  certificate_number: { label: 'Свидетельство (№)' },
  certificate_date: { label: 'Дата выдачи СРТС', placeholder: 'ДД.ММ.ГГГГ' },
  max_mass_kg: { label: 'Макс. масса, кг' },
  unladen_mass_kg: { label: 'Масса без нагрузки, кг' },
  // Поля пайплайна продажи (из договора комиссии)
  mileage: { label: 'Пробег, км' },
  cert_line: { label: 'Свидетельство о регистрации', full: true, placeholder: '№ … от ДД.ММ.ГГГГ' },
  comm_number: { label: '№ договора комиссии' },
  comm_date: { label: 'Дата договора комиссии', placeholder: 'например: 29 мая 2026' },
}
export const fieldMeta = (key) => F[key] || { label: key }

// Внутренние страницы проверки (шаг 2): фото слева, поля справа.
export const REVIEW_PAGES = [
  {
    key: 'passport_main',
    title: 'Паспорт: фото и MRZ',
    subtitle: 'идент. номер, номер паспорта, дата выдачи',
    docId: 'passport_main',
    photos: ['passport_main'],
    fields: ['identification_number', 'passport_number', 'date_of_issue'],
  },
  {
    key: 'passport_names',
    title: 'Паспорт: ФИО и орган',
    subtitle: 'фамилия, имя, отчество, кем выдан',
    docId: 'passport_names',
    photos: ['passport_names'],
    fields: ['surname_ru', 'name_ru', 'patronymic_ru', 'issuing_authority_ru'],
  },
  {
    key: 'vehicle',
    title: 'Тех. паспорт (лицевая)',
    subtitle: 'характеристики транспортного средства',
    docId: 'vehicle_front',
    photos: ['vehicle_front'],
    fields: ['make_model', 'vin', 'reg_number', 'year', 'color_ru', 'vehicle_type_ru', 'body_type_ru', 'certificate_number', 'certificate_date', 'max_mass_kg', 'unladen_mass_kg'],
  },
  {
    key: 'address',
    title: 'Адрес регистрации',
    subtitle: 'сверка прописки: паспорт и тех. паспорт',
    address: true, // особая страница: 2 фото + общий адрес
    photos: ['vehicle_back', 'passport_reg'],
  },
]

// Верхнеуровневые шаги.
export const STEPS = [
  { key: 'upload', label: 'Загрузка', icon: 'upload' },
  { key: 'review', label: 'Проверка', icon: 'idcard' },
  { key: 'manual', label: 'Реквизиты', icon: 'edit' },
  { key: 'preview', label: 'Документы', icon: 'doc' },
]

// Поля договора (ручной ввод).
export const MANUAL_FIELDS = [
  { key: 'contract_number', label: '№ договора', placeholder: 'число или Б/Н (пусто → Б/Н)' },
  { key: 'contract_date', label: 'Дата договора', placeholder: 'например: 19 июня 2026 г.' },
  { key: 'mileage', label: 'Пробег, км' },
  { key: 'price', label: 'Стоимость ТС, $' },
  { key: 'price_words', label: 'Стоимость прописью', full: true, auto: 'price' },
  { key: 'commission', label: 'Вознаграждение, руб.' },
  { key: 'commission_words', label: 'Вознаграждение прописью', full: true, auto: 'commission' },
]
export const AUTO_WORDS = { price_words: 'price', commission_words: 'commission' }

// ——— Пайплайн ПРОДАЖИ (договор купли-продажи + акт к нему) ———

// 3 загружаемых страницы паспорта покупателя (характеристики ТС берём из договора комиссии).
export const SALE_DOC_IDS = ['passport_main', 'passport_names', 'passport_reg']

// Внутренние страницы проверки продажи.
export const SALE_REVIEW_PAGES = [
  {
    key: 'passport_main',
    title: 'Паспорт покупателя: фото и MRZ',
    subtitle: 'идент. номер, номер паспорта, дата выдачи',
    docId: 'passport_main',
    fields: ['identification_number', 'passport_number', 'date_of_issue'],
  },
  {
    key: 'passport_names',
    title: 'Паспорт покупателя: ФИО и орган',
    subtitle: 'фамилия, имя, отчество, кем выдан',
    docId: 'passport_names',
    fields: ['surname_ru', 'name_ru', 'patronymic_ru', 'issuing_authority_ru'],
  },
  {
    key: 'address',
    title: 'Адрес покупателя',
    subtitle: 'прописка покупателя из паспорта',
    addressSingle: true, // 1 фото (прописка) + поле адреса, без сверки с СРТС
    photo: 'passport_reg',
  },
  {
    key: 'vehicle',
    title: 'Данные авто из договора комиссии',
    subtitle: 'характеристики ТС и реквизиты ДК — проверьте',
    vehicle: true, // без фото: поля из распознанного договора комиссии
    fields: ['make_model', 'vin', 'reg_number', 'year', 'color_ru', 'vehicle_type_ru', 'body_type_ru', 'mileage', 'cert_line', 'comm_number', 'comm_date'],
  },
]

// Реквизиты продажи (ручной ввод). Номер и дата — общие для ДКП и акта.
export const SALE_MANUAL_FIELDS = [
  { key: 'contract_number', label: '№ договора (ДКП и акта)', placeholder: 'число или Б/Н (пусто → Б/Н)' },
  { key: 'contract_date', label: 'Дата (ДКП и акта)', placeholder: 'например: 30 июня 2026 г.' },
  { key: 'price', label: 'Стоимость ТС, руб.' },
  { key: 'price_words', label: 'Стоимость прописью', full: true, auto: 'price' },
]
export const SALE_AUTO_WORDS = { price_words: 'price' }

export function makeEmptySaleManual() {
  return { contract_number: '', contract_date: todayRu(), price: '', price_words: '' }
}
export function makeEmptySaleVehicle() {
  return {
    vehicle_type_ru: '', body_type_ru: '', make_model: '', vin: '', color_ru: '',
    mileage: '', year: '', reg_number: '', cert_line: '', comm_number: '', comm_date: '',
  }
}

export function saleReviewMissing(docs, address, vehicle) {
  const m = []
  const add = (label, val) => { if (!String(val || '').trim()) m.push(label) }
  add('Фамилия', docs.passport_names.fields.surname_ru)
  add('Имя', docs.passport_names.fields.name_ru)
  add('Идент. номер', docs.passport_main.fields.identification_number)
  add('Номер паспорта', docs.passport_main.fields.passport_number)
  add('Дата выдачи', docs.passport_main.fields.date_of_issue)
  add('Адрес покупателя', address)
  add('Марка и модель', vehicle.make_model)
  add('VIN', vehicle.vin)
  add('Рег. номер', vehicle.reg_number)
  add('№ договора комиссии', vehicle.comm_number)
  add('Дата договора комиссии', vehicle.comm_date)
  return m
}
export function saleManualMissing(manual) {
  const m = []
  const add = (label, key) => { if (!String(manual[key] || '').trim()) m.push(label) }
  // № договора не обязателен: пусто → «Б/Н» (валидность проверяется отдельно).
  add('Дата договора', 'contract_date')
  add('Стоимость', 'price')
  return m
}

const RU_MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
export function todayRu(d = new Date()) {
  return `${d.getDate()} ${RU_MONTHS[d.getMonth()]} ${d.getFullYear()} г.`
}
export function makeEmptyManual() {
  return { contract_number: '', contract_date: todayRu(), mileage: '', price: '', price_words: '', commission: '', commission_words: '' }
}

// Проверка заполненности шагов (защита от перехода дальше).
export function reviewMissing(docs, address) {
  const m = []
  const add = (label, val) => { if (!String(val || '').trim()) m.push(label) }
  add('Фамилия', docs.passport_names.fields.surname_ru)
  add('Имя', docs.passport_names.fields.name_ru)
  add('Идент. номер', docs.passport_main.fields.identification_number)
  add('Номер паспорта', docs.passport_main.fields.passport_number)
  add('Дата выдачи', docs.passport_main.fields.date_of_issue)
  // «Кем выдан» не обязателен: если разворота паспорта нет, его вписывают вручную/в Word.
  add('Марка и модель', docs.vehicle_front.fields.make_model)
  add('VIN', docs.vehicle_front.fields.vin)
  add('Рег. номер', docs.vehicle_front.fields.reg_number)
  add('Адрес регистрации', address)
  return m
}
export function manualMissing(manual) {
  const m = []
  const add = (label, key) => { if (!String(manual[key] || '').trim()) m.push(label) }
  // № договора не обязателен: пусто → «Б/Н» (валидность проверяется отдельно).
  add('Дата договора', 'contract_date')
  add('Стоимость', 'price')
  add('Вознаграждение', 'commission')
  return m
}

// Номер договора: пусто → «Б/Н»; число — ок; «б/н»/«Б/Н» (любой регистр) → «Б/Н»;
// иначе (непустое и не число и не Б/Н) — недопустимо (поле подсвечивается).
const BN_RE = /^б\s*\/\s*н$/i
export function contractNumberValid(v) {
  const s = String(v || '').trim()
  return s === '' || /^\d+$/.test(s) || BN_RE.test(s)
}
export function normalizeContractNumber(v) {
  const s = String(v || '').trim()
  return s === '' || BN_RE.test(s) ? 'Б/Н' : s
}

export function isFieldWarn(key, value, lowConf = []) {
  if (lowConf.includes(key)) return true
  if (key === 'vin') return !vinValid(value)
  return false
}

// mode: null | 'commission' | 'sale'. Реквизиты и saleVehicle зависят от режима.
export function makeEmptyState(mode = null) {
  const docs = {}
  for (const id of DOC_IDS) docs[id] = { fields: {}, lowConf: [], photo: null }
  return {
    mode,
    step: 0, maxStep: 0, reviewPage: 0,
    docs, address: '', addressConflict: false,
    manual: mode === 'sale' ? makeEmptySaleManual() : makeEmptyManual(),
    saleVehicle: makeEmptySaleVehicle(),
  }
}

// Сверка адреса прописки «по якорю».
// Паспортный штамп часто рукописный и распознаётся плохо (например, номер дома
// может склеиться с цифрами даты). Тех. паспорт — печатный и полный (область,
// район, город, улица, дом). Поэтому:
//  • цепляемся за УЛИЦУ (и значимые слова): если они совпали — адрес тот же,
//    берём ПОЛНУЮ чистую версию из тех. паспорта;
//  • если значимые слова не пересеклись — возможно адреса разные: берём тех.
//    паспорт (он полнее) и помечаем для ручной сверки;
//  • если какого-то источника нет — берём имеющийся.
const STOP = new Set([
  'область', 'обл', 'район', 'рн', 'раён', 'вобласць', 'город', 'гор', 'улица', 'ул', 'вул',
  'дом', 'аг', 'гп', 'пос', 'деревня', 'республика', 'беларусь', 'рэспубліка', 'корпус', 'корп',
  'квартира', 'кватэра', 'нас', 'пункт', 'имени',
])
function sigTokens(addr) {
  return new Set(
    String(addr || '')
      .toLowerCase()
      .replace(/[^а-яёa-z\s]/gi, ' ') // только буквы — цифры (дом/дата) игнорируем
      .split(/\s+/)
      .filter((t) => t.length >= 5 && !STOP.has(t)) // «улицеподобные» значимые слова
  )
}
export function resolveRegAddress(passportAddr, srtsAddr) {
  const p = String(passportAddr || '').trim()
  const s = String(srtsAddr || '').trim()
  if (!s) return { value: p, conflict: false }
  if (!p) return { value: s, conflict: false }
  const tp = sigTokens(p)
  const ts = sigTokens(s)
  let overlap = false
  for (const t of tp) if (ts.has(t)) { overlap = true; break }
  // улица совпала -> тот же адрес -> чистый и полный вариант из тех. паспорта
  if (overlap) return { value: s, conflict: false }
  // значимые слова не пересеклись -> возможно разные адреса; берём СРТС, помечаем
  return { value: s, conflict: true }
}

// Склейка, при которой ПУСТЫЕ значения не затирают заполненные
// (в авто-режиме каждая страница возвращает все поля схемы, часть — пустые).
function mergeNonEmpty(...objs) {
  const out = {}
  for (const o of objs) {
    for (const k in o) {
      const v = o[k]
      if (v != null && String(v).trim() !== '') out[k] = v
    }
  }
  return out
}

// Плоское состояние для рендера договора и акта.
export function assembleContractState(state) {
  const d = state.docs
  // passport_main владеет номером/идент./датой выдачи (сверка по MRZ) — кладём его
  // последним, чтобы он имел приоритет в пересечениях; пустые поля не перетирают.
  const passport = mergeNonEmpty(d.passport_names.fields, d.passport_main.fields)
  passport.registration_address_ru = state.address
  return {
    passport,
    vehicle: mergeNonEmpty(d.vehicle_front.fields),
    manual: { ...state.manual, contract_number: normalizeContractNumber(state.manual.contract_number) },
  }
}

// Плоское состояние для рендера ДКП и акта продажи.
export function assembleSaleState(state) {
  const d = state.docs
  const buyer = mergeNonEmpty(d.passport_names.fields, d.passport_main.fields)
  buyer.registration_address_ru = state.address
  return {
    buyer,
    vehicle: state.saleVehicle,
    manual: { ...state.manual, contract_number: normalizeContractNumber(state.manual.contract_number) },
  }
}
