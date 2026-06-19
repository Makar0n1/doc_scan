import { useState } from 'react'
import Icon from './Icon.jsx'
import DocxPreview from './DocxPreview.jsx'
import { downloadBlob, renderContractBlob } from '../lib/api.js'

const TABS = [
  { id: 'contract', label: 'Договор' },
  { id: 'act', label: 'Акт' },
]

export default function PreviewStep({ state, onBack, onRestart }) {
  const [active, setActive] = useState('contract')
  const [rendered, setRendered] = useState(null) // кэш .docx активного документа (для Word)
  const [error, setError] = useState('')
  const [pdfBusy, setPdfBusy] = useState(false)

  function downloadWord() {
    setError('')
    if (rendered?.blob) downloadBlob(rendered.blob, rendered.filename)
    else setError('Документ ещё формируется, подождите секунду.')
  }

  async function downloadPdf() {
    setError('')
    setPdfBusy(true)
    try {
      const { blob, filename } = await renderContractBlob(state, { doc: active, format: 'pdf' })
      downloadBlob(blob, filename)
    } catch (e) {
      setError(e.message || 'Не удалось сформировать PDF.')
    } finally {
      setPdfBusy(false)
    }
  }

  return (
    <div className="animate-fade-up">
      <header className="mb-4 text-center">
        <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Документы готовы</h2>
        <p className="mt-1 text-sm text-slate-500">Точная копия. Переключайте документ и скачивайте в нужном формате.</p>
      </header>

      {/* Вкладки документов */}
      <div className="mb-4 flex justify-center">
        <div className="inline-flex rounded-lg bg-slate-100 p-0.5 sm:rounded-xl sm:p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setActive(t.id)
                setRendered(null)
              }}
              className={[
                'rounded-md px-3 py-1 text-xs font-medium transition sm:rounded-lg sm:px-4 sm:py-1.5 sm:text-sm',
                active === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700',
              ].join(' ')}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <DocxPreview key={active} state={state} doc={active} onBlob={setRendered} />

      {error && (
        <div className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="sticky bottom-0 z-10 -mx-5 mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-white/95 px-5 py-3 backdrop-blur sm:-mx-7 sm:px-7">
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={onBack}>
            <Icon name="left" className="h-4 w-4" /> Назад
          </button>
          <button className="btn-ghost" onClick={onRestart}>
            <Icon name="plus" className="h-4 w-4" /> <span className="hidden sm:inline">Новый договор</span>
          </button>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={downloadPdf} disabled={pdfBusy || !rendered}>
            <Icon name="download" className="h-4 w-4" /> {pdfBusy ? 'PDF…' : 'PDF'}
          </button>
          <button className="btn-primary" onClick={downloadWord} disabled={!rendered}>
            <Icon name="download" className="h-4 w-4" /> Word
          </button>
        </div>
      </div>
    </div>
  )
}
