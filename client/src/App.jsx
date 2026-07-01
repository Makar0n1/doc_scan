import { useEffect, useRef, useState } from 'react'
import Stepper from './components/Stepper.jsx'
import UploadStep from './components/UploadStep.jsx'
import SaleUploadStep from './components/SaleUploadStep.jsx'
import ReviewSPA from './components/ReviewSPA.jsx'
import ReviewSale from './components/ReviewSale.jsx'
import ManualStep from './components/ManualStep.jsx'
import PreviewStep from './components/PreviewStep.jsx'
import ModeSelect from './components/ModeSelect.jsx'
import Login from './components/Login.jsx'
import Icon from './components/Icon.jsx'
import { extractDoc, getSession, logout, parseCommission, composeAddress } from './lib/api.js'
import { fileToPreviewDataUrl } from './lib/image.js'
import { loadState, saveState, clearState } from './lib/storage.js'
import {
  STEPS, DOC_IDS, SALE_DOC_IDS, NAME_FIELDS, VEHICLE_UPPER_FIELDS,
  makeEmptyState, makeEmptySaleVehicle,
  assembleContractState, assembleSaleState, resolveRegAddress,
  SALE_MANUAL_FIELDS, SALE_AUTO_WORDS, saleManualMissing,
} from './lib/fields.js'
import { titleCaseName } from '../../shared/contractData.js'
import { rublesWords } from '../../shared/num2words.js'

const MODE_LABEL = { commission: 'Комиссия', sale: 'Продажа (ДКП)' }
const SALE_WORD_GEN = { price_words: (v) => rublesWords(v, { kopecks: false }) }
const SALE_TABS = [
  { id: 'dkp', label: 'Договор' },
  { id: 'akt_dkp', label: 'Акт' },
]

function initialState() {
  const s = loadState()
  if (s && s.docs && s.manual && typeof s.step === 'number') return s
  return makeEmptyState()
}

// Достраивает адрес прописки: штамп (passport_reg) + орган выдачи (passport_names).
// При ошибке/отсутствии данных возвращает исходный штамп.
async function composeRegAddress(docs) {
  const raw = String(docs.passport_reg?.fields?.registration_address_ru || '').trim()
  const issuing = String(docs.passport_names?.fields?.issuing_authority_ru || '').trim()
  if (!raw || !issuing) return raw
  try {
    return await composeAddress(issuing, raw)
  } catch {
    return raw
  }
}

// Регистр распознанных полей: ФИО — обычный, характеристики ТС — заглавными.
function normalizeFields(docId, raw) {
  const f = { ...raw }
  delete f.low_confidence_fields
  delete f.doc_type
  // ФИО — обычный регистр (и на развороте паспорта, и в УЛАСНІК на обороте тех. паспорта)
  if (docId === 'passport_names' || docId === 'vehicle_back') for (const k of NAME_FIELDS) if (f[k]) f[k] = titleCaseName(f[k])
  if (docId === 'vehicle_front') for (const k of VEHICLE_UPPER_FIELDS) if (f[k]) f[k] = String(f[k]).toUpperCase()
  return f
}

export default function App() {
  const [auth, setAuth] = useState({ checked: false, required: false, authenticated: false })
  useEffect(() => {
    getSession().then((s) => setAuth({ checked: true, required: !!s.required, authenticated: !!s.authenticated }))
  }, [])

  const [state, setState] = useState(initialState)
  const step = state.step
  const current = STEPS[step]

  const firstRun = useRef(true)
  const skipSave = useRef(false)
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      return
    }
    if (skipSave.current) {
      // После сброса не перезаписываем localStorage — он должен остаться пустым.
      skipSave.current = false
      return
    }
    saveState(state)
  }, [state])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step])

  const goto = (i) => setState((st) => ({ ...st, step: i, maxStep: Math.max(st.maxStep, i) }))
  const setReviewPage = (i) => setState((st) => ({ ...st, reviewPage: i }))
  const setDocField = (docId, key, value) =>
    setState((st) => ({ ...st, docs: { ...st.docs, [docId]: { ...st.docs[docId], fields: { ...st.docs[docId].fields, [key]: value } } } }))
  const setManual = (key, value) => setState((st) => ({ ...st, manual: { ...st.manual, [key]: value } }))
  const setAddress = (value) => setState((st) => ({ ...st, address: value, addressConflict: false }))
  const setVehicleField = (key, value) => setState((st) => ({ ...st, saleVehicle: { ...st.saleVehicle, [key]: value } }))

  // === Комиссия: распознавание пачки фото (модель сама определяет тип) ===
  async function runExtractAll(fileList) {
    const items = await Promise.all(
      fileList.map(async (f) => ({ photo: await fileToPreviewDataUrl(f), file: f }))
    )
    const settled = await Promise.allSettled(items.map((it) => extractDoc('auto', it.file)))

    const docs = makeEmptyState().docs // 5 пустых слотов
    const leftovers = []
    let anyOk = false

    items.forEach((it, i) => {
      const r = settled[i]
      if (r.status !== 'fulfilled') return
      anyOk = true
      const raw = r.value
      const dt = raw.doc_type
      if (DOC_IDS.includes(dt) && !docs[dt].photo) {
        docs[dt] = { fields: normalizeFields(dt, raw), lowConf: raw.low_confidence_fields || [], photo: it.photo }
      } else {
        leftovers.push(it.photo)
      }
    })
    if (!anyOk) throw new Error('Не удалось распознать документы. Проверьте ключ OpenRouter и попробуйте снова.')

    for (const id of DOC_IDS) {
      if (!docs[id].photo && leftovers.length) docs[id] = { fields: {}, lowConf: [], photo: leftovers.shift() }
    }

    // Если разворот паспорта с ФИО не загружен — берём ФИО владельца с оборота тех. паспорта.
    const pn = docs.passport_names.fields
    const vb = docs.vehicle_back.fields
    if (!String(pn.surname_ru || '').trim() && String(vb.surname_ru || '').trim()) {
      docs.passport_names.fields = {
        ...pn,
        surname_ru: vb.surname_ru || '',
        name_ru: vb.name_ru || '',
        patronymic_ru: vb.patronymic_ru || '',
      }
    }

    if (String(vb.certificate_date || '').trim() && !String(docs.vehicle_front.fields.certificate_date || '').trim()) {
      docs.vehicle_front.fields = { ...docs.vehicle_front.fields, certificate_date: vb.certificate_date }
    }

    // Достраиваем адрес прописки по органу выдачи (область + район/город),
    // затем сверяем с адресом из тех. паспорта.
    const passAddr = await composeRegAddress(docs)
    const { value, conflict } = resolveRegAddress(passAddr, docs.vehicle_back.fields.registration_address_ru)

    setState((st) => ({
      ...st,
      docs,
      address: value,
      addressConflict: conflict,
      step: 1,
      maxStep: Math.max(st.maxStep, 1),
      reviewPage: 0,
    }))
  }

  // === Продажа: разбор договора комиссии + распознавание паспорта покупателя ===
  async function runSaleExtract({ contractFile, photoFiles }) {
    let saleVehicle = makeEmptySaleVehicle()
    if (contractFile) {
      const parsed = await parseCommission(contractFile)
      saleVehicle = { ...saleVehicle, ...parsed }
    }

    const docs = makeEmptyState('sale').docs
    const photos = photoFiles || []
    if (photos.length) {
      const items = await Promise.all(photos.map(async (f) => ({ photo: await fileToPreviewDataUrl(f), file: f })))
      const settled = await Promise.allSettled(items.map((it) => extractDoc('auto', it.file)))
      const leftovers = []
      items.forEach((it, i) => {
        const r = settled[i]
        if (r.status !== 'fulfilled') { leftovers.push(it.photo); return }
        const raw = r.value
        const dt = raw.doc_type
        if (SALE_DOC_IDS.includes(dt) && !docs[dt].photo) {
          docs[dt] = { fields: normalizeFields(dt, raw), lowConf: raw.low_confidence_fields || [], photo: it.photo }
        } else {
          leftovers.push(it.photo)
        }
      })
      for (const id of SALE_DOC_IDS) {
        if (!docs[id].photo && leftovers.length) docs[id] = { fields: {}, lowConf: [], photo: leftovers.shift() }
      }
    }

    const address = await composeRegAddress(docs)
    setState((st) => ({
      ...st,
      mode: 'sale',
      docs,
      address,
      addressConflict: false,
      saleVehicle,
      step: 1,
      maxStep: Math.max(st.maxStep, 1),
      reviewPage: 0,
    }))
  }

  // Ручной режим: без фото/файлов, сразу к заполнению полей.
  function goManual() {
    setState((st) => ({ ...st, step: 1, maxStep: Math.max(st.maxStep, 1), reviewPage: 0 }))
  }

  function pickMode(mode) {
    skipSave.current = false
    setState(makeEmptyState(mode))
  }
  // «Новый документ» — тот же режим с чистого листа.
  function newDocument() {
    skipSave.current = true
    clearState()
    setState(makeEmptyState(state.mode))
  }
  // «Сменить режим» — к выбору типа сделки.
  function changeMode() {
    skipSave.current = true
    clearState()
    setState(makeEmptyState(null))
  }

  async function doLogout() {
    await logout()
    setAuth((a) => ({ ...a, authenticated: false }))
  }

  // Пока проверяем сессию — короткий лоадер; если нужен вход — экран входа.
  if (!auth.checked) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-slate-100">
        <svg className="h-7 w-7 animate-spin text-brand-600" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-20" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-90" d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    )
  }
  if (auth.required && !auth.authenticated) {
    return <Login onSuccess={() => setAuth((a) => ({ ...a, authenticated: true }))} />
  }
  // Не выбран тип сделки — экран выбора режима.
  if (!state.mode) {
    return <ModeSelect onSelect={pickMode} />
  }

  const isSale = state.mode === 'sale'

  return (
    <div className="flex h-[100dvh] items-center justify-center bg-slate-100 p-3 sm:p-6">
      <div className="flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-xl2 bg-white shadow-card ring-1 ring-slate-100 sm:h-full">
        <div className="flex shrink-0 items-start gap-2 px-5 pt-5 sm:px-7 sm:pt-6">
          <div className="min-w-0 flex-1">
            <Stepper current={step} maxStep={state.maxStep} onJump={goto} />
          </div>
          <button
            onClick={changeMode}
            title="Сменить тип сделки"
            className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <Icon name="switch" className="h-4 w-4" />
            <span className="hidden text-xs font-medium sm:inline">{MODE_LABEL[state.mode]}</span>
          </button>
          {auth.required && (
            <button
              onClick={doLogout}
              title="Выйти"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <Icon name="logout" className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-5 sm:px-7 sm:pt-6">
          {current.key === 'upload' &&
            (isSale ? (
              <SaleUploadStep onExtract={runSaleExtract} onManual={goManual} />
            ) : (
              <UploadStep onExtractAll={runExtractAll} onManual={goManual} />
            ))}

          {current.key === 'review' &&
            (isSale ? (
              <ReviewSale
                page={state.reviewPage}
                setPage={setReviewPage}
                docs={state.docs}
                onDocField={setDocField}
                address={state.address}
                setAddress={setAddress}
                vehicle={state.saleVehicle}
                onVehicleField={setVehicleField}
                onBackStep={() => goto(0)}
                onNextStep={() => goto(2)}
              />
            ) : (
              <ReviewSPA
                page={state.reviewPage}
                setPage={setReviewPage}
                docs={state.docs}
                onDocField={setDocField}
                address={state.address}
                setAddress={setAddress}
                addressConflict={state.addressConflict}
                onBackStep={() => goto(0)}
                onNextStep={() => goto(2)}
              />
            ))}

          {current.key === 'manual' &&
            (isSale ? (
              <ManualStep
                manual={state.manual}
                setManual={setManual}
                onBack={() => goto(1)}
                onNext={() => goto(3)}
                fields={SALE_MANUAL_FIELDS}
                autoMap={SALE_AUTO_WORDS}
                wordGen={SALE_WORD_GEN}
                missing={saleManualMissing}
                subtitle="Номер и дата — общие для ДКП и акта. Стоимость вводится вручную."
              />
            ) : (
              <ManualStep manual={state.manual} setManual={setManual} onBack={() => goto(1)} onNext={() => goto(3)} />
            ))}

          {current.key === 'preview' &&
            (isSale ? (
              <PreviewStep
                state={assembleSaleState(state)}
                onBack={() => goto(2)}
                onRestart={newDocument}
                tabs={SALE_TABS}
                signatureAnchor={false}
              />
            ) : (
              <PreviewStep state={assembleContractState(state)} onBack={() => goto(2)} onRestart={newDocument} />
            ))}
        </div>
      </div>
    </div>
  )
}
