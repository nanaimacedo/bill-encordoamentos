'use client'

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { Check, X, AlertTriangle, Info } from 'lucide-react'

interface Toast {
  id: string
  title: string
  description?: string
  type: 'success' | 'error' | 'warning' | 'info'
}

interface ToastContextType {
  toast: (t: Omit<Toast, 'id'>) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

const icons = {
  success: Check,
  error: X,
  warning: AlertTriangle,
  info: Info,
}

const colors = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
}

const iconColors = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false)
  const Icon = icons[toast.type]

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const timer = setTimeout(() => onDismiss(toast.id), 4000)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all duration-300 ease-out ${colors[toast.type]} ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${iconColors[toast.type]}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{toast.title}</p>
        {toast.description && <p className="text-xs mt-0.5 opacity-80">{toast.description}</p>}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 p-0.5 rounded hover:bg-black/5 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const addToast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
    setToasts(prev => {
      const next = [...prev, { ...t, id }]
      return next.slice(-3) // max 3 visible
    })
  }, [])

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80 max-sm:left-4 max-sm:right-4 max-sm:w-auto max-sm:top-2">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
