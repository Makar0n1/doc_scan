import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import { buildContractData } from '../../shared/contractData.js'
import { buildSaleData } from '../../shared/saleData.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Шаблоны документов в корне проекта.
//  contract/act — комиссия; dkp/akt_dkp — продажа (договор купли-продажи + акт к нему).
const TEMPLATES = {
  contract: path.resolve(__dirname, '../../template.docx'),
  act: path.resolve(__dirname, '../../template_akt.docx'),
  dkp: path.resolve(__dirname, '../../template_dkp.docx'),
  akt_dkp: path.resolve(__dirname, '../../template_akt_dkp.docx'),
}

// Какие документы строятся из данных продажи (buildSaleData), а не комиссии.
const SALE_DOCS = new Set(['dkp', 'akt_dkp'])

// Шаблоны читаем один раз в память (на диск при работе ничего не пишем).
const cache = {}
function getTemplate(which) {
  const file = TEMPLATES[which]
  if (!file) throw new Error(`Неизвестный документ: ${which}`)
  if (!cache[which]) {
    if (!fs.existsSync(file)) throw new Error(`Не найден шаблон ${path.basename(file)} в корне проекта`)
    cache[which] = fs.readFileSync(file)
  }
  return cache[which]
}

/**
 * Рендерит документ по шаблону. Возвращает Buffer .docx.
 *  • 'contract'|'act'    — комиссия (buildContractData);
 *  • 'dkp'|'akt_dkp'     — продажа (buildSaleData).
 * @param {'contract'|'act'|'dkp'|'akt_dkp'} which
 * @param {object} state состояние формы соответствующего пайплайна
 * @returns {Buffer}
 */
export function renderDoc(which, state) {
  const zip = new PizZip(getTemplate(which))
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '{', end: '}' },
    nullGetter: () => '', // пустые/отсутствующие поля — пустой строкой, не "undefined"
  })
  doc.render(SALE_DOCS.has(which) ? buildSaleData(state) : buildContractData(state))
  return doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' })
}
