import { useEffect, useRef, useState } from 'react'
import { renderAsync } from 'docx-preview'
import { renderContractBlob } from '../lib/api.js'
import Icon from './Icon.jsx'

/**
 * Точная копия договора: запрашивает реальный .docx с бэкенда и рендерит его
 * в браузере через docx-preview. Документ масштабируется по ШИРИНЕ контейнера
 * (без горизонтального скролла), вертикальный скролл сохраняется.
 */
export default function DocxPreview({ state, doc = 'contract', onBlob, signatureAnchor = /КОМИССИОНЕР/i }) {
  const viewportRef = useRef(null) // область со скроллом
  const contentRef = useRef(null) // сюда рендерит docx-preview
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [error, setError] = useState('')

  // Косметика ТОЛЬКО для предпросмотра: docx-preview схлопывает отступ сверху
  // у первого абзаца в ячейке таблицы, поэтому блок подписей прилипает к реквизитам.
  // В скачанном .docx отступ есть — здесь добавляем его визуально.
  function applyPreviewTweaks() {
    if (!signatureAnchor) return // напр. для ДКП блок подписей в одной строке — отступ не нужен
    const root = contentRef.current
    if (!root) return
    const tables = [...root.querySelectorAll('table')]
    const reqTable = [...tables].reverse().find((t) => signatureAnchor.test(t.textContent || ''))
    if (!reqTable) return
    const rows = reqTable.querySelectorAll('tr')
    if (rows.length < 2) return // нет отдельной строки подписей — ничего не двигаем
    const lastRow = rows[rows.length - 1] // строка с подписями
    lastRow?.querySelectorAll('td, th').forEach((cell) => {
      cell.style.paddingTop = '38px'
    })
  }

  // Масштабирует страницу A4 под ширину контейнера (только zoom, без переноса строк).
  function fitWidth() {
    const vp = viewportRef.current
    const content = contentRef.current
    if (!vp || !content) return
    content.style.zoom = '1'
    const natural = content.scrollWidth // фиксированная ширина страницы (+ поля)
    const avail = vp.clientWidth
    if (natural > 0) content.style.zoom = String(Math.min(1, avail / natural))
  }

  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(async () => {
      setStatus('loading')
      setError('')
      try {
        const { blob, filename } = await renderContractBlob(state, { doc, format: 'docx' })
        if (cancelled) return
        onBlob?.({ blob, filename })
        const buf = await blob.arrayBuffer()
        if (cancelled || !contentRef.current) return
        contentRef.current.innerHTML = ''
        await renderAsync(buf, contentRef.current, undefined, {
          className: 'docx',
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          breakPages: true,
          experimental: true,
        })
        if (!cancelled) {
          applyPreviewTweaks()
          fitWidth()
          setStatus('ready')
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message || 'Не удалось построить предпросмотр')
          setStatus('error')
        }
      }
    }, 400) // дебаунс: не дёргаем рендер на каждое нажатие
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [state, doc])

  // Пересчитываем масштаб при изменении ширины контейнера (адаптив).
  useEffect(() => {
    const vp = viewportRef.current
    if (!vp || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => fitWidth())
    ro.observe(vp)
    return () => ro.disconnect()
  }, [])

  return (
    <div className="relative">
      {status === 'loading' && (
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-center gap-2 rounded-t-lg bg-white/80 py-2 text-xs font-medium text-slate-500 backdrop-blur">
          <svg className="h-4 w-4 animate-spin text-brand-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-20" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-90" d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          Обновляем предпросмотр…
        </div>
      )}
      {status === 'error' && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <div
        ref={viewportRef}
        className="docx-viewport max-h-[58vh] overflow-y-auto overflow-x-hidden rounded-lg bg-slate-100 text-center ring-1 ring-slate-200"
      >
        {/* inline-block: ширина = ширине страницы (не зависит от контейнера) → zoom масштабирует ровно */}
        <div ref={contentRef} className="inline-block origin-top text-left align-top" />
      </div>
    </div>
  )
}
