// Единый источник правды для документов ПРОДАЖИ (договор купли-продажи + акт
// приёма-передачи к нему). Преобразует состояние формы в плоский объект
// плейсхолдеров шаблонов template_dkp.docx и template_akt_dkp.docx.
//
// Источники данных:
//  • buyer    — паспорт покупателя (распознаётся с фото, как в комиссии);
//  • vehicle  — характеристики ТС и № / дата договора комиссии (берутся из
//               загруженного ранее сгенерированного договора комиссии);
//  • manual   — № и дата ДКП, стоимость ТС и сумма прописью (вводятся вручную).

import { titleCaseName, shortFio } from './contractData.js'

// Полный список плейсхолдеров шаблонов продажи.
export const SALE_PLACEHOLDER_KEYS = [
  'contract_number', 'contract_date',
  'comm_number', 'comm_date',
  'fio', 'fio_short', 'identification_number', 'passport_number', 'issued', 'reg_address',
  'vehicle_type', 'body_type', 'make_model', 'vin', 'color', 'mileage', 'year', 'reg_number', 'cert_line',
  'price', 'price_words',
]

const clean = (v) => (v == null ? '' : String(v).trim())
// Характеристики ТС в документах идут ЗАГЛАВНЫМИ (как на бланке СРТС / в договоре комиссии).
const upper = (v) => clean(v).toUpperCase()

/**
 * Собирает плоский объект плейсхолдеров для ДКП и акта продажи.
 * @param {{buyer?:object, vehicle?:object, manual?:object}} state
 * @returns {Record<string,string>}
 */
export function buildSaleData(state = {}) {
  const b = state.buyer || {}
  const v = state.vehicle || {}
  const m = state.manual || {}

  const fio = [b.surname_ru, b.name_ru, b.patronymic_ru]
    .map(titleCaseName)
    .filter(Boolean)
    .join(' ')

  // «Выдан …»: орган есть → «Выдан <орган> от <дата>»; органа нет → просто «Выдан».
  const auth = clean(b.issuing_authority_ru)
  const issDate = clean(b.date_of_issue)
  const issued = auth ? (issDate ? `Выдан ${auth} от ${issDate}` : `Выдан ${auth}`) : 'Выдан'

  const data = {
    // Ручной ввод
    contract_number: clean(m.contract_number),
    contract_date: clean(m.contract_date),
    price: clean(m.price),
    price_words: clean(m.price_words),

    // Из договора комиссии (ссылка в п. 1.2 ДКП)
    comm_number: clean(v.comm_number),
    comm_date: clean(v.comm_date),

    // Паспорт покупателя
    fio,
    fio_short: shortFio(b.surname_ru, b.name_ru, b.patronymic_ru),
    identification_number: clean(b.identification_number),
    passport_number: clean(b.passport_number),
    issued,
    reg_address: clean(b.registration_address_ru),

    // Характеристики ТС (из договора комиссии) — текстовые ЗАГЛАВНЫМИ
    vehicle_type: upper(v.vehicle_type_ru),
    body_type: upper(v.body_type_ru),
    make_model: upper(v.make_model),
    vin: upper(v.vin),
    color: upper(v.color_ru),
    mileage: clean(v.mileage),
    year: clean(v.year),
    reg_number: upper(v.reg_number),
    cert_line: clean(v.cert_line),
  }

  for (const k of SALE_PLACEHOLDER_KEYS) if (data[k] == null) data[k] = ''
  return data
}
