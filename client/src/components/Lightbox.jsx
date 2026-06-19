import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from './Icon.jsx'

// Текстовое поле с авто-высотой (для длинных значений, напр. адреса).
function AutoTextarea({ className, value, ...props }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = el.scrollHeight + 'px'
    }
  }, [value])
  return <textarea ref={ref} rows={1} value={value} className={className} {...props} />
}

// Фото. На десктопе (есть мышь) — лупа при наведении. На тач/мобиле — просто фото.
function Magnifier({ src, enabled }) {
  const ref = useRef(null)
  const [lens, setLens] = useState(null)
  const Z = 1.5
  const R = 150

  function move(e) {
    const r = ref.current.getBoundingClientRect()
    const x = e.clientX - r.left
    const y = e.clientY - r.top
    if (x < 0 || y < 0 || x > r.width || y > r.height) return setLens(null)
    setLens({ x, y, w: r.width, h: r.height })
  }

  return (
    <div className="flex items-center justify-center">
      <div
        ref={ref}
        onMouseMove={enabled ? move : undefined}
        onMouseLeave={enabled ? () => setLens(null) : undefined}
        className="relative inline-block overflow-hidden rounded-xl shadow-2xl"
      >
        <img
          src={src}
          alt=""
          draggable={false}
          className={[
            'block max-h-[55vh] max-w-full select-none object-contain lg:max-h-[82vh]',
            enabled ? 'cursor-none' : '',
          ].join(' ')}
        />
        {enabled && lens && (
          <div
            className="pointer-events-none absolute rounded-full ring-2 ring-white/80"
            style={{
              left: lens.x - R,
              top: lens.y - R,
              width: R * 2,
              height: R * 2,
              backgroundImage: `url(${src})`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: `${lens.w * Z}px ${lens.h * Z}px`,
              backgroundPosition: `${R - lens.x * Z}px ${R - lens.y * Z}px`,
              boxShadow: '0 16px 60px rgba(0,0,0,.6), inset 0 0 0 1px rgba(255,255,255,.15)',
            }}
          />
        )}
      </div>
    </div>
  )
}

/**
 * Полноэкранный лайтбокс сверки (портал в body). На десктопе — лупа,
 * на тач/мобиле — обычное увеличенное фото; весь бокс скроллится по вертикали.
 */
export default function Lightbox({ photos, index = 0, fields, onChange, onClose }) {
  const [i, setI] = useState(index)
  const [magnify, setMagnify] = useState(false)
  const multi = photos.length > 1

  useEffect(() => {
    // Лупа только там, где есть мышь (десктоп).
    setMagnify(window.matchMedia('(hover: hover) and (pointer: fine)').matches)
    function onKey(e) {
      if (e.key === 'Escape') onClose()
      if (multi && e.key === 'ArrowLeft') setI((p) => (p - 1 + photos.length) % photos.length)
      if (multi && e.key === 'ArrowRight') setI((p) => (p + 1) % photos.length)
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [multi, photos.length, onClose])

  const go = (d) => setI((p) => (p + d + photos.length) % photos.length)

  const node = (
    // Бэкдроп со скроллом: на узком экране высокий бокс прокручивается целиком.
    <div className="lb-backdrop fixed inset-0 z-[1000] overflow-y-auto bg-slate-950/85 backdrop-blur-md" onClick={onClose}>
      <button
        onClick={onClose}
        className="fixed right-4 top-4 z-[1001] flex h-11 w-11 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
        title="Закрыть (Esc)"
      >
        <Icon name="x" className="h-6 w-6" />
      </button>

      <div className="flex min-h-full items-center justify-center p-4 sm:p-10">
        <div
          className="lb-box grid w-full max-w-[1400px] items-center gap-6 lg:grid-cols-[1.6fr_1fr] lg:gap-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Фото */}
          <div className="relative">
            <Magnifier key={photos[i].src} src={photos[i].src} enabled={magnify} />
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-white/45">
              {magnify && <Icon name="zoom" className="h-4 w-4" />}
              <span>{photos[i].caption || (magnify ? 'Наведите курсор для увеличения' : '')}</span>
            </div>

            {multi && (
              <>
                <button
                  onClick={() => go(-1)}
                  className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-slate-900/55 text-white/80 backdrop-blur transition hover:bg-slate-900/90 hover:text-white"
                >
                  <Icon name="left" className="h-5 w-5" />
                </button>
                <button
                  onClick={() => go(1)}
                  className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-slate-900/55 text-white/80 backdrop-blur transition hover:bg-slate-900/90 hover:text-white"
                >
                  <Icon name="right" className="h-5 w-5" />
                </button>
                <div className="mt-3 flex justify-center gap-1.5">
                  {photos.map((_, k) => (
                    <button
                      key={k}
                      onClick={() => setI(k)}
                      className={['h-2 rounded-full transition-all', k === i ? 'w-7 bg-white' : 'w-2 bg-white/30 hover:bg-white/50'].join(' ')}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Поля (светлые, на подчёркивании); на десктопе со своим скроллом */}
          <div className="flex flex-col gap-5 lg:max-h-[82vh] lg:overflow-y-auto lg:pr-2">
            <p className="text-xs font-medium uppercase tracking-wider text-white/40">Сверьте с фото и поправьте при необходимости</p>
            {fields.map((f) => (
              <label key={f.key} className="block">
                <span className="mb-2 block text-xs font-medium text-white/50">{f.label}</span>
                {(() => {
                  const cls = [
                    'w-full border-0 border-b bg-transparent px-0 py-2 text-xl text-white outline-none transition placeholder:text-white/20',
                    f.multiline ? 'resize-none overflow-hidden leading-snug' : '',
                    f.warn ? 'border-amber-400' : 'border-white/20 focus:border-white',
                  ].join(' ')
                  const props = {
                    value: f.value || '',
                    placeholder: f.placeholder,
                    onChange: (e) => onChange(f.key, e.target.value),
                    className: cls,
                  }
                  return f.multiline ? <AutoTextarea {...props} /> : <input {...props} />
                })()}
                {f.warn && <span className="mt-1.5 block text-[11px] text-amber-300">проверьте вручную</span>}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(node, document.body)
}
