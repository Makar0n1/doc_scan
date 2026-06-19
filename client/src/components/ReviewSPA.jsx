import { useState } from 'react'
import Icon from './Icon.jsx'
import Field from './Field.jsx'
import Lightbox from './Lightbox.jsx'
import { REVIEW_PAGES, fieldMeta, isFieldWarn, reviewMissing } from '../lib/fields.js'

const PHOTO_CAPTIONS = {
  passport_main: 'Паспорт — фото и MRZ',
  passport_names: 'Паспорт — ФИО',
  vehicle_front: 'Тех. паспорт — лицевая',
  vehicle_back: 'Тех. паспорт — оборотная',
  passport_reg: 'Паспорт — прописка',
}

function PhotoFrame({ src, caption, onOpen }) {
  return (
    <figure
      onClick={src ? onOpen : undefined}
      className={[
        'group relative overflow-hidden rounded-xl2 bg-slate-100 ring-1 ring-slate-200 transition',
        src ? 'cursor-zoom-in hover:ring-brand-300' : '',
      ].join(' ')}
    >
      {src ? (
        <img src={src} alt={caption} className="h-full max-h-[52vh] w-full object-contain" />
      ) : (
        <div className="flex h-44 items-center justify-center text-sm text-slate-400">нет фото</div>
      )}
      {src && (
        <span className="pointer-events-none absolute right-2 top-2 flex items-center gap-1 rounded-lg bg-slate-900/55 px-2 py-1 text-[11px] font-medium text-white opacity-0 backdrop-blur transition group-hover:opacity-100">
          <Icon name="zoom" className="h-3.5 w-3.5" /> увеличить
        </span>
      )}
      {caption && <figcaption className="bg-white/70 px-3 py-1.5 text-center text-[11px] font-medium text-slate-500">{caption}</figcaption>}
    </figure>
  )
}

export default function ReviewSPA({ page, setPage, docs, onDocField, address, setAddress, addressConflict, onBackStep, onNextStep }) {
  const cfg = REVIEW_PAGES[page]
  const last = REVIEW_PAGES.length - 1
  const doc = cfg.docId ? docs[cfg.docId] : null
  // Есть ли фото для этой страницы (в ручном режиме фото нет — показываем только поля).
  const hasPhoto = cfg.address ? cfg.photos.some((pid) => docs[pid]?.photo) : !!doc?.photo
  const [error, setError] = useState('')
  const [lbIndex, setLbIndex] = useState(null) // индекс фото в лайтбоксе или null

  // Данные для лайтбокса текущей страницы.
  const lb = cfg.address
    ? {
        photos: cfg.photos.map((pid) => ({ src: docs[pid]?.photo, caption: PHOTO_CAPTIONS[pid] })),
        fields: [{ key: 'address', label: 'Адрес регистрации (прописка)', value: address, warn: addressConflict, multiline: true }],
        onChange: (_k, v) => setAddress(v),
      }
    : {
        photos: [{ src: doc?.photo, caption: PHOTO_CAPTIONS[cfg.docId] }],
        fields: cfg.fields.map((key) => {
          const m = fieldMeta(key)
          return { key, label: m.label, value: doc.fields[key], placeholder: m.placeholder, warn: isFieldWarn(key, doc.fields[key], doc.lowConf) }
        }),
        onChange: (k, v) => onDocField(cfg.docId, k, v),
      }

  function next() {
    if (page < last) return setPage(page + 1)
    const missing = reviewMissing(docs, address)
    if (missing.length) return setError('Заполните обязательные поля: ' + missing.join(', ') + '.')
    setError('')
    onNextStep()
  }

  return (
    <div className="animate-fade-up">
      <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 sm:text-xl">{cfg.title}</h2>
          <p className="mt-0.5 text-sm text-slate-500">{cfg.subtitle}</p>
        </div>
        <div className="flex items-center gap-1.5">
          {REVIEW_PAGES.map((p, idx) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPage(idx)}
              title={p.title}
              className={['h-2 rounded-full transition-all', idx === page ? 'w-6 bg-brand-600' : 'w-2 bg-slate-200 hover:bg-slate-300'].join(' ')}
            />
          ))}
          <span className="ml-2 text-xs font-medium text-slate-400">
            {page + 1}/{REVIEW_PAGES.length}
          </span>
        </div>
      </header>

      <div className={hasPhoto ? 'grid gap-5 lg:grid-cols-2' : ''}>
        {hasPhoto && (
          <div className="lg:sticky lg:top-2 lg:self-start">
            {cfg.address ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {cfg.photos.map((pid, k) => (
                  <PhotoFrame key={pid} src={docs[pid]?.photo} caption={PHOTO_CAPTIONS[pid]} onOpen={() => setLbIndex(k)} />
                ))}
              </div>
            ) : (
              <PhotoFrame src={doc?.photo} caption={PHOTO_CAPTIONS[cfg.docId]} onOpen={() => setLbIndex(0)} />
            )}
          </div>
        )}

        <div>
          {cfg.address ? (
            <div className="space-y-3">
              <Field label="Адрес регистрации (прописка)" value={address} full multiline warn={addressConflict} onChange={setAddress} />
              {addressConflict ? (
                <p className="flex items-start gap-1.5 rounded-xl border border-warn-300 bg-warn-50 px-3 py-2 text-xs text-warn-700">
                  <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
                  Улицы в паспорте и тех. паспорте не совпали — подставлен полный адрес из тех. паспорта. Сверьте с фото.
                </p>
              ) : (
                <p className="text-xs text-slate-400">
                  Улица совпала — взят полный адрес из тех. паспорта (область, район, город, улица, дом). Поле можно поправить.
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">
              {cfg.fields.map((key) => {
                const m = fieldMeta(key)
                return (
                  <Field
                    key={key}
                    label={m.label}
                    value={doc.fields[key]}
                    placeholder={m.placeholder}
                    full={m.full}
                    warn={isFieldWarn(key, doc.fields[key], doc.lowConf)}
                    onChange={(val) => onDocField(cfg.docId, key, val)}
                  />
                )
              })}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-5 flex items-start gap-2 rounded-xl border border-warn-300 bg-warn-50 px-4 py-3 text-sm text-warn-700">
          <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="sticky bottom-0 z-10 -mx-5 mt-6 flex items-center justify-between gap-3 border-t border-slate-100 bg-white/95 px-5 py-3 backdrop-blur sm:-mx-7 sm:px-7">
        <button className="btn-ghost" onClick={() => (page > 0 ? setPage(page - 1) : onBackStep())}>
          <Icon name="left" className="h-4 w-4" /> Назад
        </button>
        <button className="btn-primary" onClick={next}>
          {page < last ? 'Далее' : 'К реквизитам'} <Icon name="right" className="h-4 w-4" />
        </button>
      </div>

      {lbIndex !== null && (
        <Lightbox
          photos={lb.photos}
          index={lbIndex}
          fields={lb.fields}
          onChange={lb.onChange}
          onClose={() => setLbIndex(null)}
        />
      )}
    </div>
  )
}
