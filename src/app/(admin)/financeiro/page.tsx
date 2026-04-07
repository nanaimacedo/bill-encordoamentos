'use client'

import { useEffect, useState } from 'react'
import { DollarSign, Check, Filter } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Pagamento {
  id: string
  valor: number
  status: string
  formaPagamento: string
  createdAt: string
  dataPagamento: string | null
  cliente: { id: string; nome: string; telefone: string }
  encordoamento: { corda: { nome: string }; tensao: number } | null
}

export default function FinanceiroPage() {
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'todos' | 'pendente' | 'pago'>('todos')

  const carregar = async () => {
    setLoading(true)
    const params = filtro !== 'todos' ? `?status=${filtro}` : ''
    const res = await fetch(`/api/pagamentos${params}`)
    const data = await res.json()
    setPagamentos(data)
    setLoading(false)
  }

  useEffect(() => { carregar() }, [filtro])

  const marcarPago = async (id: string, forma: string) => {
    await fetch(`/api/pagamentos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'pago', formaPagamento: forma }),
    })
    carregar()
  }

  const totalPendente = pagamentos
    .filter(p => p.status === 'pendente')
    .reduce((sum, p) => sum + p.valor, 0)

  const totalPago = pagamentos
    .filter(p => p.status === 'pago')
    .reduce((sum, p) => sum + p.valor, 0)

  return (
    <div className="p-4 md:p-6 space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Financeiro</h1>

      {/* Resumo */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-red-50 rounded-xl p-4 border border-red-100">
          <p className="text-xs text-red-600 uppercase font-semibold">Pendente</p>
          <p className="text-xl font-bold text-red-700">{formatCurrency(totalPendente)}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
          <p className="text-xs text-green-600 uppercase font-semibold">Recebido</p>
          <p className="text-xl font-bold text-green-700">{formatCurrency(totalPago)}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {(['todos', 'pendente', 'pago'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filtro === f
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'todos' ? 'Todos' : f === 'pendente' ? 'Pendentes' : 'Pagos'}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-xl p-4 animate-pulse h-20" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {pagamentos.length === 0 && (
            <p className="text-center text-gray-400 py-8 text-sm">Nenhum pagamento encontrado</p>
          )}
          {pagamentos.map(p => (
            <div key={p.id} className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-sm text-gray-800">{p.cliente.nome}</p>
                  {p.encordoamento && (
                    <p className="text-xs text-gray-500">
                      {p.encordoamento.corda.nome} - {p.encordoamento.tensao}lbs
                    </p>
                  )}
                  <p className="text-xs text-gray-400">{formatDate(p.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${p.status === 'pendente' ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(p.valor)}
                  </p>
                  {p.status === 'pago' && p.formaPagamento && (
                    <p className="text-xs text-gray-400 uppercase">{p.formaPagamento}</p>
                  )}
                </div>
              </div>

              {p.status === 'pendente' && (
                <div className="flex gap-2 mt-2">
                  {['PIX', 'Dinheiro', 'Cartão'].map(forma => (
                    <button
                      key={forma}
                      onClick={() => marcarPago(p.id, forma.toLowerCase())}
                      className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-lg bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 transition-colors"
                    >
                      <Check className="w-3 h-3" /> {forma}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
