import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import { buildContractData } from '../../shared/contractData.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Шаблоны документов в корне проекта.
const TEMPLATES = {
  contract: path.resolve(__dirname, '../../template.docx'),
  act: path.resolve(__dirname, '../../template_akt.docx'),
}

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
 * Рендерит документ ('contract' | 'act') по шаблону. Возвращает Buffer .docx.
 * Оба документа используют один и тот же набор данных (buildContractData).
 * @param {'contract'|'act'} which
 * @param {{passport?:object, vehicle?:object, manual?:object}} state
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
  doc.render(buildContractData(state))
  return doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' })
}
