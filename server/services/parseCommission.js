// Разбор ранее сгенерированного договора комиссии (.docx) для пайплайна продажи.
// Договор комиссии формируется этим же сервисом по template.docx, поэтому его
// структура известна: таблица характеристик ТС («Характеристика | Значение»)
// и заголовок с номером и датой. Извлекаем характеристики ТС и № / дату ДК.

import PizZip from 'pizzip'

const stripTags = (s) => s.replace(/<[^>]+>/g, '')
function cellText(tc) {
  const m = tc.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || []
  return m.map(stripTags).join('').trim()
}

// Метка строки таблицы характеристик → ключ.
const LABELS = {
  'тип тс': 'vehicle_type_ru',
  'тип кузова': 'body_type_ru',
  'марка и модель': 'make_model',
  vin: 'vin',
  'цвет': 'color_ru',
  'пробег': 'mileage',
  'год выпуска': 'year',
  'регистрационный номер': 'reg_number',
  'свидетельство о регистрации': 'cert_line',
}

const MONTHS = 'января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря'

/**
 * @param {Buffer} buffer .docx договора комиссии
 * @returns {{vehicle_type_ru,body_type_ru,make_model,vin,color_ru,mileage,year,reg_number,cert_line,comm_number,comm_date}}
 */
export function parseCommissionContract(buffer) {
  let xml
  try {
    xml = new PizZip(buffer).file('word/document.xml').asText()
  } catch {
    const e = new Error('Не удалось прочитать файл. Загрузите договор комиссии в формате Word (.docx).')
    e.status = 400
    throw e
  }

  const out = {
    vehicle_type_ru: '', body_type_ru: '', make_model: '', vin: '', color_ru: '',
    mileage: '', year: '', reg_number: '', cert_line: '', comm_number: '', comm_date: '',
  }

  // Характеристики ТС — из строк таблиц (метка в первой ячейке, значение во второй).
  for (const tbl of xml.match(/<w:tbl>[\s\S]*?<\/w:tbl>/g) || []) {
    for (const tr of tbl.match(/<w:tr\b[\s\S]*?<\/w:tr>/g) || []) {
      const cells = (tr.match(/<w:tc>[\s\S]*?<\/w:tc>/g) || []).map(cellText)
      if (cells.length < 2) continue
      const key = LABELS[cells[0].toLowerCase().replace(/\s+/g, ' ').trim()]
      if (key && !out[key]) {
        let val = cells[1].trim()
        if (key === 'mileage') val = val.replace(/км/gi, '').trim()
        out[key] = val
      }
    }
  }

  // Номер и дата договора комиссии — из заголовка.
  const plain = stripTags(xml.replace(/<\/w:p>/g, '\n')).replace(/[ \t]+/g, ' ')
  const num = plain.match(/ТРАНСПОРТНОГО СРЕДСТВА\s*№\s*([^\s\n]+)/i)
  if (num) out.comm_number = num[1].trim()
  // Первая «словесная» дата (ДД месяц ГГГГ) — это дата договора; «г.» убираем.
  const date = plain.match(new RegExp(`(\\d{1,2}\\s+(?:${MONTHS})\\s+\\d{4})`, 'i'))
  if (date) out.comm_date = date[1].trim()

  return out
}
