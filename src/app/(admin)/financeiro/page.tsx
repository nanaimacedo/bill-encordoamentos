'use client'

import { useEffect, useState } from 'react'
import { DollarSign, Check, Filter, Download } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useToast } from '@/components/Toast'

interface Pagamento {
  id: string
  valor: number
  status: string
  formaPagamento: string
  createdAt: string
  dataPagamento: string | null
  cliente: { id: string; nome: string; telefone: string }
  encordoamento: { corda: { nome: string }; tensao: number; centroReceita?: string } | null
}

export default function FinanceiroPage() {
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'todos' | 'pendente' | 'pago'>('todos')
  const [centro, setCentro] = useState<'todos' | 'loja' | 'delivery'>('todos')
  const { toast } = useToast()

  const carregar = async () => {
    setLoading(true)
    try {
      const params = filtro !== 'todos' ? `?status=${filtro}` : ''
      const res = await fetch(`/api/pagamentos${params}`)
      const data = await res.json()
      setPagamentos(data)
    } catch {
      toast({ title: 'Erro ao carregar pagamentos', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [filtro])

  const marcarPago = async (id: string, forma: string) => {
    try {
      const res = await fetch(`/api/pagamentos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'pago', formaPagamento: forma }),
      })
      if (!res.ok) throw new Error('Falha ao atualizar')
      toast({ title: 'Pagamento confirmado!', type: 'success' })
      carregar()
    } catch {
      toast({ title: 'Erro ao confirmar pagamento', type: 'error' })
    }
  }

  const exportarCSV = () => {
    const headers = 'Data,Cliente,Servico,Valor,Status,Forma Pagamento,Centro\n'
    const rows = pagamentosFiltrados.map(p =>
      `${formatDate(p.createdAt)},"${p.cliente.nome}",${p.encordoamento?.corda?.nome || 'N/A'},${p.valor},${p.status},${p.formaPagamento || 'N/A'},${p.encordoamento?.centroReceita || 'N/A'}`
    ).join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `financeiro_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const pagamentosFiltrados = centro === 'todos'
    ? pagamentos
    : pagamentos.filter(p => p.encordoamento?.centroReceita === centro)

  const totalPendente = pagamentosFiltrados
    .filter(p => p.status === 'pendente')
    .reduce((sum, p) => sum + p.valor, 0)

  const totalPago = pagamentosFiltrados
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

      {/* Filtro Centro de Receita + Exportar */}
      <div className="flex gap-2 items-center">
        {(['todos', 'loja', 'delivery'] as const).map(c => (
          <button key={c} onClick={() => setCentro(c)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              centro === c ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {c === 'todos' ? 'Todos' : c === 'loja' ? 'Loja' : 'Delivery'}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={exportarCSV}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          title="Exportar CSV"
        >
          <Download className="w-4 h-4" /> Exportar
        </button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-xl p-4 animate-pulse h-20" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {pagamentosFiltrados.length === 0 && (
            <p className="text-center text-gray-400 py-8 text-sm">Nenhum pagamento encontrado</p>
          )}
          {pagamentosFiltrados.map(p => (
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
