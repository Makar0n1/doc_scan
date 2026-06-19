import { useState } from 'react'
import Icon from './Icon.jsx'
import { login } from '../lib/api.js'

export default function Login({ onSuccess }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(password)
      onSuccess()
    } catch (err) {
      setError(err.message || 'Не удалось войти.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-100 p-4">
      <form onSubmit={submit} className="card w-full max-w-sm animate-fade-up p-7">
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <Icon name="lock" className="h-7 w-7" />
          </div>
          <h1 className="text-lg font-bold text-slate-900">Вход в сервис</h1>
          <p className="mt-1 text-sm text-slate-500">Доступ по паролю. Сессия сохраняется надолго.</p>
        </div>

        <label className="label">Пароль</label>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={['input', error ? 'input-warn' : ''].join(' ')}
          placeholder="••••••••"
        />
        {error && (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-red-600">
            <Icon name="alert" className="h-4 w-4" /> {error}
          </p>
        )}

        <button type="submit" className="btn-primary mt-5 w-full" disabled={busy || !password}>
          {busy ? 'Входим…' : 'Войти'}
        </button>
      </form>
    </div>
  )
}
