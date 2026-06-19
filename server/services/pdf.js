import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const execFileP = promisify(execFile)

// Возможные пути к LibreOffice (soffice). Можно переопределить LIBREOFFICE_PATH.
const CANDIDATES = [
  process.env.LIBREOFFICE_PATH,
  '/Applications/LibreOffice.app/Contents/MacOS/soffice',
  '/usr/bin/soffice',
  '/usr/local/bin/soffice',
  '/opt/homebrew/bin/soffice',
  '/snap/bin/libreoffice',
].filter(Boolean)

function resolveSoffice() {
  for (const c of CANDIDATES) if (existsSync(c)) return c
  return 'soffice' // последний шанс — найти в PATH (иначе поймаем ENOENT)
}

const NO_LIBRE =
  'PDF недоступен: на сервере не установлен LibreOffice. ' +
  'Установите его (macOS: brew install --cask libreoffice; Debian/Ubuntu: apt-get install libreoffice) ' +
  'или задайте путь в LIBREOFFICE_PATH. Документ можно скачать в формате .docx.'

/**
 * Конвертирует .docx (Buffer) в .pdf (Buffer) через headless LibreOffice.
 * Использует временный каталог, который удаляется сразу после чтения PDF
 * (на диске ничего не остаётся).
 * @param {Buffer} docxBuffer
 * @returns {Promise<Buffer>}
 */
export async function convertDocxToPdf(docxBuffer) {
  const soffice = resolveSoffice()
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'docx2pdf-'))
  try {
    const inPath = path.join(dir, 'contract.docx')
    await fs.writeFile(inPath, docxBuffer)
    await execFileP(
      soffice,
      [
        '--headless',
        '--convert-to',
        'pdf',
        '--outdir',
        dir,
        inPath,
        // изолированный профиль, чтобы не конфликтовать с запущенным LibreOffice
        `-env:UserInstallation=file://${path.join(dir, 'profile')}`,
      ],
      { timeout: 60000 }
    )
    return await fs.readFile(path.join(dir, 'contract.pdf'))
  } catch (e) {
    if (e.code === 'ENOENT') throw new Error(NO_LIBRE)
    throw new Error('Не удалось конвертировать документ в PDF.')
  } finally {
    // Чистим временные файлы при любом исходе.
    await fs.rm(dir, { recursive: true, force: true }).catch(() => {})
  }
}
