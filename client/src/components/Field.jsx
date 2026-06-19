import { useEffect, useRef } from 'react'
import Icon from './Icon.jsx'

// Текстовое поле с авто-высотой (растёт под содержимое) — для длинных значений.
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

// Одно поле формы. Подсвечивается, если warn=true. multiline — перенос строк.
export default function Field({ label, value, onChange, warn, placeholder, full, trailing, multiline }) {
  const cls = ['input', warn ? 'input-warn' : '', multiline ? 'resize-none overflow-hidden leading-snug' : ''].join(' ')
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label className="label flex items-center justify-between gap-2">
        <span>{label}</span>
        {trailing}
      </label>
      {multiline ? (
        <AutoTextarea className={cls} value={value || ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className={cls} value={value || ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
      {warn && (
        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-warn-700">
          <Icon name="alert" className="h-3.5 w-3.5" /> проверьте вручную
        </p>
      )}
    </div>
  )
}
