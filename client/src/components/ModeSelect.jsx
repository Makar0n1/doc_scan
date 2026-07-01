import Icon from './Icon.jsx'

const MODES = [
  { id: 'commission', icon: 'idcard', title: 'Комиссия' },
  { id: 'sale', icon: 'car', title: 'Продажа (ДКП)' },
]

export default function ModeSelect({ onSelect }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-2xl animate-fade-up">
        <h1 className="mb-6 text-center text-xl font-bold text-slate-900 sm:text-2xl">Что оформляем?</h1>

        <div className="grid gap-4 sm:grid-cols-2">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelect(m.id)}
              className="group flex flex-col items-center gap-4 rounded-xl2 bg-white p-8 text-center shadow-card ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:ring-brand-300"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-100">
                <Icon name={m.icon} className="h-8 w-8" />
              </span>
              <span className="text-lg font-bold text-slate-900">{m.title}</span>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-600">
                Начать <Icon name="right" className="h-4 w-4" />
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
