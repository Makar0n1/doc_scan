import { useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'

function Thumb({ file, onRemove }) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    const u = URL.createObjectURL(file)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [file])
  return (
    <div className="group relative overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200">
      {url && <img src={url} alt="" className="h-28 w-full object-cover" />}
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-slate-500 opacity-0 shadow-sm transition group-hover:opacity-100 hover:text-red-600"
        title="Убрать"
      >
        <Icon name="trash" className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export default function SaleUploadStep({ onExtract, onManual }) {
  const [contract, setContract] = useState(null) // .docx договора комиссии
  const [photos, setPhotos] = useState([]) // до 3 фото паспорта покупателя
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const contractRef = useRef(null)
  const photoRef = useRef(null)

  const isDocx = (f) => /\.docx$/i.test(f.name) || f.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  function addContract(list) {
    const f = [...list].find(isDocx)
    if (f) setContract(f)
  }
  function addPhotos(list) {
    const imgs = [...list].filter((f) => f.type.startsWith('image/'))
    setPhotos((prev) => [...prev, ...imgs].slice(0, 3))
  }
  const removePhoto = (i) => setPhotos((prev) => prev.filter((_, idx) => idx !== i))

  async function run() {
    setError('')
    setBusy(true)
    try {
      await onExtract({ contractFile: contract, photoFiles: photos })
    } catch (e) {
      setError(e.message || 'Не удалось обработать. Попробуйте ещё раз.')
    } finally {
      setBusy(false)
    }
  }

  if (busy) {
    return (
      <div className="animate-fade-up py-12 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
          <svg className="h-7 w-7 animate-spin text-brand-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-20" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-90" d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-slate-900">Обрабатываем…</h2>
        <p className="mt-1 text-sm text-slate-500">Читаем договор комиссии и распознаём паспорт покупателя.</p>
      </div>
    )
  }

  return (
    <div className="animate-fade-up">
      <header className="mb-5">
        <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Договор комиссии и паспорт покупателя</h2>
        <p className="mt-1 text-sm text-slate-500">
          Загрузите ранее сгенерированный договор комиссии (.docx) и 3 фото паспорта покупателя.
        </p>
      </header>

      {/* Договор комиссии (.docx) */}
      <div
        onClick={() => contractRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          addContract(e.dataTransfer.files)
        }}
        className={[
          'flex cursor-pointer items-center gap-3 rounded-xl2 border-2 border-dashed p-4 transition-all',
          contract ? 'border-brand-300 bg-brand-50/60' : 'border-slate-200 bg-slate-50/60 hover:border-brand-300 hover:bg-slate-50',
        ].join(' ')}
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm ring-1 ring-slate-100">
          <Icon name={contract ? 'check' : 'doc'} className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          {contract ? (
            <>
              <p className="truncate text-sm font-semibold text-slate-800">{contract.name}</p>
              <p className="text-xs text-slate-400">Договор комиссии загружен · нажмите, чтобы заменить</p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-slate-700">Договор комиссии (.docx)</p>
              <p className="text-xs text-slate-400">Из него подтянутся характеристики ТС и № / дата ДК</p>
            </>
          )}
        </div>
        {contract && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setContract(null)
            }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-white hover:text-red-600"
            title="Убрать"
          >
            <Icon name="x" className="h-4 w-4" />
          </button>
        )}
        <input
          ref={contractRef}
          type="file"
          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={(e) => {
            addContract(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {/* Фото паспорта покупателя */}
      <div
        onClick={() => photoRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          addPhotos(e.dataTransfer.files)
        }}
        className="mt-4 flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl2 border-2 border-dashed border-slate-200 bg-slate-50/60 p-6 text-center transition-all hover:border-brand-300 hover:bg-slate-50"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-sm ring-1 ring-slate-100">
          <Icon name="upload" className="h-6 w-6" />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-700">3 фото паспорта покупателя</p>
          <p className="mt-1 text-xs text-slate-400">страница с фото, разворот с ФИО, страница с пропиской · можно с камеры</p>
        </div>
        <input
          ref={photoRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            addPhotos(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {photos.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          {photos.map((f, i) => (
            <Thumb key={i} file={f} onRemove={() => removePhoto(i)} />
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-center gap-2 text-sm">
        <span className="text-slate-400">Нет файлов?</span>
        <button type="button" onClick={onManual} className="font-medium text-brand-600 hover:text-brand-700">
          Заполнить вручную
        </button>
      </div>

      {error && (
        <div className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="sticky bottom-0 z-10 -mx-5 mt-6 flex flex-col-reverse items-center gap-3 border-t border-slate-100 bg-white/95 px-5 py-3 backdrop-blur sm:-mx-7 sm:flex-row sm:justify-between sm:px-7">
        <p className="text-center text-xs text-slate-400 sm:text-left">
          Файлы обрабатываются в памяти и не сохраняются.
        </p>
        <button className="btn-primary w-full sm:w-auto" disabled={!contract && photos.length < 1} onClick={run}>
          Обработать <Icon name="right" className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
