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

export default function UploadStep({ onExtractAll, onManual }) {
  const [files, setFiles] = useState([])
  const [drag, setDrag] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  function addFiles(list) {
    const imgs = [...list].filter((f) => f.type.startsWith('image/'))
    setFiles((prev) => [...prev, ...imgs].slice(0, 5)) // не больше 5
  }
  const removeAt = (i) => setFiles((prev) => prev.filter((_, idx) => idx !== i))

  async function extract() {
    setError('')
    setBusy(true)
    try {
      await onExtractAll(files)
    } catch (e) {
      setError(e.message || 'Не удалось распознать документы. Попробуйте ещё раз.')
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
        <h2 className="text-lg font-bold text-slate-900">Распознаём и раскладываем…</h2>
        <p className="mt-1 text-sm text-slate-500">Определяем тип каждой страницы и извлекаем данные.</p>
      </div>
    )
  }

  return (
    <div className="animate-fade-up">
      <header className="mb-5">
        <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Загрузите документы</h2>
        <p className="mt-1 text-sm text-slate-500">
          Перетащите все 5 фотографий сразу — система сама определит, где что. Порядок не важен.
        </p>
      </header>

      {/* Один дроп-зон на несколько файлов */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDrag(true)
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDrag(false)
          addFiles(e.dataTransfer.files)
        }}
        className={[
          'flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl2 border-2 border-dashed p-8 text-center transition-all',
          drag ? 'border-brand-400 bg-brand-50 scale-[1.01]' : 'border-slate-200 bg-slate-50/60 hover:border-brand-300 hover:bg-slate-50',
        ].join(' ')}
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-sm ring-1 ring-slate-100">
          <Icon name="upload" className="h-7 w-7" />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-700">Перетащите фотографии сюда или нажмите</p>
          <p className="mt-1 text-xs text-slate-400">3 страницы паспорта + 2 стороны тех. паспорта · можно с камеры</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {/* Превью загруженных */}
      {files.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
          {files.map((f, i) => (
            <Thumb key={i} file={f} onRemove={() => removeAt(i)} />
          ))}
        </div>
      )}

      {/* Альтернатива — без фото */}
      <div className="mt-4 flex items-center justify-center gap-2 text-sm">
        <span className="text-slate-400">Нет фотографий?</span>
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
          {files.length === 5
            ? 'Все 5 страниц загружены — изображения обрабатываются в памяти и не сохраняются.'
            : `Загружено ${files.length} из 5. Лучше добавить все пять страниц.`}
        </p>
        <button className="btn-primary w-full sm:w-auto" disabled={files.length < 1} onClick={extract}>
          Распознать и разложить <Icon name="right" className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
