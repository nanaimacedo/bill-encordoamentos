'use client'

import { useEffect, useState, useCallback } from 'react'
import { Search, Download, Calendar, Package, Clock, CheckCircle, XCircle, RotateCcw, Filter } from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { useToast } from '@/components/Toast'
import Link from 'next/link'

interface Venda {
  id: string
  preco: number
  tipo: string
  status: string
  entrega: string
  tensao: number
  tensaoCross: number | null
  centroReceita: string
  observacoes: string
  createdAt: string
  cliente: { id: string; nome: string; telefone: string }
  corda: { id: string; nome: string; marca: string } | null
  pagamento: { id: string; status: string; formaPagamento: string | null } | null
}

interface Resumo {
  quantidade: number
  total: number
  totalPago: number
  totalPendente: number
}

const PERIODOS = [
  { value: 'hoje', label: 'Hoje' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mês' },
  { value: 'todos', label: 'Todos' },
] as const

const STATUS_OPTS = [
  { value: 'todos', label: 'Todos' },
  { value: 'pendente', label: 'Pendentes' },
  { value: 'concluido', label: 'Concluídos' },
] as const

export default function VendasPage() {
  const [vendas, setVendas] = useState<Venda[]>([])
  const [resumo, setResumo] = useState<Resumo>({ quantidade: 0, total: 0, totalPago: 0, totalPendente: 0 })
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState<string>('hoje')
  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('todos')
  const { toast } = useToast()

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ periodo, status: statusFiltro })
      if (busca) params.set('busca', busca)
      const res = await fetch(`/api/vendas?${params}`)
      const data = await res.json()
      setVendas(data.vendas || [])
      setResumo(data.resumo || { quantidade: 0, total: 0, totalPago: 0, totalPendente: 0 })
    } catch {
      toast({ title: 'Erro ao carregar vendas', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [periodo, busca, statusFiltro, toast])

  useEffect(() => { carregar() }, [carregar])

  // Debounce busca
  const [buscaDebounced, setBuscaDebounced] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setBusca(buscaDebounced), 300)
    return () => clearTimeout(t)
  }, [buscaDebounced])

  const exportarCSV = () => {
    const periodoLabel = PERIODOS.find(p => p.value === periodo)?.label || periodo
    const resumoHeader = [
      `RELATÓRIO DE VENDAS - ${periodoLabel.toUpperCase()}`,
      `Gerado em: ${formatDateTime(new Date().toISOString())}`,
      `Total de vendas: ${resumo.quantidade}`,
      `Faturamento total: R$ ${resumo.total.toFixed(2)}`,
      `Recebido: R$ ${resumo.totalPago.toFixed(2)}`,
      `Pendente: R$ ${resumo.totalPendente.toFixed(2)}`,
      `Ticket médio: R$ ${resumo.quantidade > 0 ? (resumo.total / resumo.quantidade).toFixed(2) : '0.00'}`,
      '',
    ].join('\n')

    const headers = 'Data,Cliente,Telefone,Corda,Tensão,Tipo,Valor,Status Pgto,Forma Pgto,Entrega,Centro\n'
    const rows = vendas.map(v =>
      `${formatDateTime(v.createdAt)},"${v.cliente.nome}","${v.cliente.telefone}","${v.corda?.nome || 'Avulsa'}",${v.tensao || ''}lbs,${v.tipo},${v.preco},${v.pagamento?.status || 'N/A'},${v.pagamento?.formaPagamento || 'N/A'},${v.entrega},${v.centroReceita}`
    ).join('\n')
    const blob = new Blob([resumoHeader + headers + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio_vendas_${periodo}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getStatusIcon = (venda: Venda) => {
    if (venda.pagamento?.status === 'pago') return <CheckCircle className="w-4 h-4 text-green-500" />
    if (venda.status === 'pendente') return <Clock className="w-4 h-4 text-amber-500" />
    return <XCircle className="w-4 h-4 text-red-500" />
  }

  const getStatusLabel = (venda: Venda) => {
    if (venda.pagamento?.status === 'pago') return 'Pago'
    return 'Pendente'
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Vendas</h1>
        <div className="flex gap-2">
          <button onClick={carregar} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors" title="Atualizar">
            <RotateCcw className="w-4 h-4 text-gray-600" />
          </button>
          <button onClick={exportarCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 text-sm font-medium transition-colors">
            <Download className="w-4 h-4" /> CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
          <p className="text-xs text-blue-600 uppercase font-semibold">Vendas</p>
          <p className="text-xl font-bold text-blue-700">{resumo.quantidade}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
          <p className="text-xs text-emerald-600 uppercase font-semibold">Total</p>
          <p className="text-xl font-bold text-emerald-700">{formatCurrency(resumo.total)}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-3 border border-green-100">
          <p className="text-xs text-green-600 uppercase font-semibold">Recebido</p>
          <p className="text-xl font-bold text-green-700">{formatCurrency(resumo.totalPago)}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-3 border border-red-100">
          <p className="text-xs text-red-600 uppercase font-semibold">Pendente</p>
          <p className="text-xl font-bold text-red-700">{formatCurrency(resumo.totalPendente)}</p>
        </div>
      </div>

      {/* Ticket médio */}
      {resumo.quantidade > 0 && (
        <div className="bg-white rounded-xl p-3 border border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-500">Ticket médio</span>
          <span className="text-sm font-bold text-gray-800">{formatCurrency(resumo.total / resumo.quantidade)}</span>
        </div>
      )}

      {/* Filtros */}
      <div className="space-y-3">
        {/* Período */}
        <div className="flex gap-2 overflow-x-auto">
          {PERIODOS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriodo(p.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                periodo === p.value
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Busca + Status */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={buscaDebounced}
              onChange={e => setBuscaDebounced(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <select
            value={statusFiltro}
            onChange={e => setStatusFiltro(e.target.value)}
            className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            {STATUS_OPTS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de Vendas */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => <div key={i} className="bg-white rounded-xl p-4 animate-pulse h-24" />)}
        </div>
      ) : vendas.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Nenhuma venda encontrada</p>
          <p className="text-gray-300 text-xs mt-1">Altere o período ou filtros</p>
        </div>
      ) : (
        <div className="space-y-2">
          {vendas.map(v => (
            <div key={v.id} className="bg-white rounded-xl p-4 border border-gray-100 hover:border-emerald-200 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(v)}
                    <p className="font-medium text-sm text-gray-800 truncate">{v.cliente.nome}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                    {v.corda && (
                      <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                        {v.corda.nome} {v.tensao ? `${v.tensao}lbs` : ''}
                      </span>
                    )}
                    {v.tipo === 'hibrida' && (
                      <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium">Híbrida</span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full font-medium ${
                      v.entrega === 'delivery' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                      {v.entrega === 'delivery' ? 'Delivery' : 'Loja'}
                    </span>
                    {v.pagamento?.formaPagamento && (
                      <span className="text-gray-400 uppercase">{v.pagamento.formaPagamento}</span>
                    )}
                  </div>
                  {v.observacoes && (
                    <p className="text-xs text-gray-400 mt-1 truncate">{v.observacoes}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    {formatDateTime(v.createdAt)}
                  </p>
                </div>
                <div className="text-right ml-3 flex-shrink-0">
                  <p className={`text-lg font-bold ${
                    v.pagamento?.status === 'pago' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(v.preco)}
                  </p>
                  <p className={`text-xs font-medium ${
                    v.pagamento?.status === 'pago' ? 'text-green-500' : 'text-amber-500'
                  }`}>
                    {getStatusLabel(v)}
                  </p>
                </div>
              </div>
              {/* Ação rápida: refazer venda */}
              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                <Link
                  href={`/encordoamento?clienteId=${v.cliente.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" /> Nova venda p/ {v.cliente.nome.split(' ')[0]}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
