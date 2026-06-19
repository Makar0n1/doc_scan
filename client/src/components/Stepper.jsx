import Icon from './Icon.jsx'
import { STEPS } from '../lib/fields.js'

export default function Stepper({ current, maxStep, onJump }) {
  return (
    <div>
      {/* Десктоп: полный степпер с иконками */}
      <ol className="hidden items-center justify-center gap-1 sm:flex">
        {STEPS.map((s, i) => {
          const done = i < current
          const active = i === current
          const reachable = i <= maxStep
          return (
            <li key={s.key} className="flex items-center gap-1">
              <button
                type="button"
                disabled={!reachable}
                onClick={() => reachable && onJump(i)}
                className={[
                  'flex items-center gap-2 rounded-xl px-2.5 py-1.5 transition',
                  reachable ? 'cursor-pointer hover:bg-slate-50' : 'cursor-default',
                ].join(' ')}
              >
                <span
                  className={[
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition',
                    active ? 'bg-brand-600 text-white shadow-sm' : '',
                    done ? 'bg-brand-100 text-brand-700' : '',
                    !active && !done ? 'bg-slate-100 text-slate-400' : '',
                  ].join(' ')}
                >
                  {done ? <Icon name="check" className="h-4 w-4" strokeWidth={2.4} /> : <Icon name={s.icon} className="h-4 w-4" />}
                </span>
                <span className={['text-sm font-medium transition', active ? 'text-slate-900' : 'text-slate-400'].join(' ')}>
                  {s.label}
                </span>
              </button>
              {i < STEPS.length - 1 && <span className="h-px w-4 bg-slate-200" />}
            </li>
          )
        })}
      </ol>

      {/* Мобайл: компактный прогресс + подпись текущего шага */}
      <div className="sm:hidden">
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500">
          <span className="inline-flex items-center gap-1.5 text-slate-800">
            <Icon name={STEPS[current].icon} className="h-4 w-4" />
            {STEPS[current].label}
          </span>
          <span>
            Шаг {current + 1} из {STEPS.length}
          </span>
        </div>
        <div className="flex gap-1">
          {STEPS.map((s, i) => (
            <button
              key={s.key}
              type="button"
              disabled={i > maxStep}
              onClick={() => i <= maxStep && onJump(i)}
              className={[
                'h-1.5 flex-1 rounded-full transition-all',
                i === current ? 'bg-brand-600' : i < current ? 'bg-brand-300' : 'bg-slate-200',
              ].join(' ')}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
