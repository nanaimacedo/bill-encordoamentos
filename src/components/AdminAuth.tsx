'use client'

import { useState, useEffect, ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { LogoFull } from './Logo'

function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  const auth = localStorage.getItem('admin_auth')
  if (!auth) return false
  try {
    const { authenticated, timestamp } = JSON.parse(auth)
    if (!authenticated) return false
    const elapsed = Date.now() - timestamp
    const twentyFourHours = 24 * 60 * 60 * 1000
    return elapsed < twentyFourHours
  } catch {
    return false
  }
}

export default function AdminAuth({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false)
  const [checking, setChecking] = useState(true)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setAuthed(isAuthenticated())
    setChecking(false)
  }, [])

  const handleLogin = async () => {
    if (pin.length !== 4) {
      setError('Digite um PIN de 4 digitos')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      })
      const data = await res.json()
      if (data.success) {
        localStorage.setItem('admin_auth', JSON.stringify({
          authenticated: true,
          timestamp: Date.now(),
        }))
        setAuthed(true)
      } else {
        setError('PIN incorreto')
        setPin('')
      }
    } catch {
      setError('Erro ao verificar PIN')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-400 text-sm">Carregando...</div>
      </div>
    )
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm space-y-6">
          <div className="text-center space-y-4">
            <img src="/logo.jpeg" alt="Bill Encordoamento Profissional" className="h-24 mx-auto object-contain" />
            <p className="text-sm text-gray-500">Acesso administrativo</p>
          </div>

          <div className="space-y-4">
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="PIN de 4 digitos"
              value={pin}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 4)
                setPin(val)
                setError('')
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-center text-2xl tracking-[0.5em] outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              autoFocus
            />

            <button
              onClick={handleLogin}
              disabled={loading || pin.length !== 4}
              className="w-full py-3 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Verificando...' : 'Entrar'}
            </button>

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
