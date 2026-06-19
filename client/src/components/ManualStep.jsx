import { useState } from 'react'
import Icon from './Icon.jsx'
import Field from './Field.jsx'
import { MANUAL_FIELDS, AUTO_WORDS, manualMissing } from '../lib/fields.js'
import { dollarsWords, rublesWords } from '../../../shared/num2words.js'

const WORD_GEN = { price_words: dollarsWords, commission_words: rublesWords }

/**
 * Шаг ручного ввода полей договора. Сумма прописью (со склонением валюты)
 * подставляется автоматически из числа и редактируется.
 */
export default function ManualStep({ manual, setManual, onBack, onNext }) {
  const [autoWords, setAutoWords] = useState({ price_words: true, commission_words: true })
  const [error, setError] = useState('')

  function next() {
    const missing = manualMissing(manual)
    if (missing.length) {
      setError('Заполните: ' + missing.join(', ') + '.')
      return
    }
    setError('')
    onNext()
  }

  function handleChange(key, val) {
    setManual(key, val)
    const wordsKey = Object.keys(AUTO_WORDS).find((wk) => AUTO_WORDS[wk] === key)
    if (wordsKey && autoWords[wordsKey]) setManual(wordsKey, WORD_GEN[wordsKey](val))
  }

  function handleWords(key, val) {
    setAutoWords((s) => ({ ...s, [key]: false }))
    setManual(key, val)
  }

  function regen(wordsKey) {
    setAutoWords((s) => ({ ...s, [wordsKey]: true }))
    setManual(wordsKey, WORD_GEN[wordsKey](manual[AUTO_WORDS[wordsKey]]))
  }

  return (
    <div className="animate-fade-up">
      <header className="mb-5">
        <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Реквизиты договора</h2>
        <p className="mt-1 text-sm text-slate-500">Заполните поля, которых нет в документах.</p>
      </header>

      <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">
        {MANUAL_FIELDS.map((f) => {
          const isWords = !!f.auto
          return (
            <Field
              key={f.key}
              label={f.label}
              value={manual[f.key]}
              placeholder={f.placeholder}
              full={f.full}
              onChange={(val) => (isWords ? handleWords(f.key, val) : handleChange(f.key, val))}
              trailing={
                isWords ? (
                  <button
                    type="button"
                    onClick={() => regen(f.key)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-600 hover:text-brand-700"
                    title="Сгенерировать прописью из числа"
                  >
                    <Icon name="refresh" className="h-3.5 w-3.5" /> прописью
                  </button>
                ) : null
              }
            />
          )
        })}
      </div>

      {error && (
        <div className="mt-5 flex items-start gap-2 rounded-xl border border-warn-300 bg-warn-50 px-4 py-3 text-sm text-warn-700">
          <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="sticky bottom-0 z-10 -mx-5 mt-6 flex items-center justify-between gap-3 border-t border-slate-100 bg-white/95 px-5 py-3 backdrop-blur sm:-mx-7 sm:px-7">
        <button className="btn-ghost" onClick={onBack}>
          <Icon name="left" className="h-4 w-4" /> Назад
        </button>
        <button className="btn-primary" onClick={next}>
          К договору <Icon name="right" className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
