'use client'

import { useEffect, useState, useCallback } from 'react'
import { Search, Download, Calendar, Package, Clock, CheckCircle, XCircle, RotateCcw, Filter, Check, CreditCard, Banknote, Smartphone, MessageCircle, X, Copy, Send } from 'lucide-react'
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
  { value: 'todos', label: 'Todos' },
  { value: 'hoje', label: 'Hoje' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mês Atual' },
  { value: '2026-04', label: 'Abr' },
  { value: '2026-03', label: 'Mar' },
  { value: '2026-02', label: 'Fev' },
  { value: '2026-01', label: 'Jan' },
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
  const [periodo, setPeriodo] = useState<string>('todos')
  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('todos')
  const [cobranca, setCobranca] = useState<{ venda: Venda; template: number } | null>(null)
  const [msgCustom, setMsgCustom] = useState('')
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

  const marcarPago = async (pagamentoId: string, forma: string, clienteNome: string) => {
    // Atualização otimista — muda no local instantaneamente, sem reload
    setVendas(prev => prev.map(v =>
      v.pagamento?.id === pagamentoId
        ? { ...v, pagamento: { ...v.pagamento, status: 'pago', formaPagamento: forma } }
        : v
    ))
    setResumo(prev => {
      const venda = vendas.find(v => v.pagamento?.id === pagamentoId)
      const valor = venda?.preco || 0
      return {
        ...prev,
        totalPago: prev.totalPago + valor,
        totalPendente: prev.totalPendente - valor,
      }
    })

    try {
      const res = await fetch(`/api/pagamentos/${pagamentoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'pago', formaPagamento: forma }),
      })
      if (!res.ok) {
        // Reverte se falhar
        carregar()
        throw new Error('Falha')
      }
      toast({ title: `${clienteNome} — ${forma.toUpperCase()}`, type: 'success' })
    } catch {
      toast({ title: 'Erro ao confirmar pagamento', type: 'error' })
    }
  }

  // --- Cobrança WhatsApp ---
  const PIX_CHAVE = '11952323401'
  const PIX_NOME = 'Elioenai P Macedo'

  const getPrimeiroNome = (nome: string) => nome.split(' ')[0]

  const getSaudacao = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Bom dia'
    if (h < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  const getDetalhesVenda = (v: Venda) => {
    const itens: string[] = []
    // Extrair produtos das observações
    const obs = v.observacoes || ''
    const prodMatch = obs.match(/Produto:\s*(.+?)(\s*\||$)/)
    if (prodMatch) {
      itens.push(`${prodMatch[1].trim()}: ${formatCurrency(v.preco)}`)
    } else if (v.corda) {
      itens.push(`${v.corda.nome} ${v.tensao ? v.tensao + 'lbs' : ''}: ${formatCurrency(v.preco)}`)
    } else {
      itens.push(`Serviço: ${formatCurrency(v.preco)}`)
    }
    return itens.join('\n')
  }

  const gerarMensagem = (v: Venda, template: number): string => {
    const nome = getPrimeiroNome(v.cliente.nome)
    const saudacao = getSaudacao()
    const detalhes = getDetalhesVenda(v)
    const total = formatCurrency(v.preco)

    const templates = [
      // Template 1: Cobrança gentil
      `${saudacao}, ${nome}! Tudo bem?! 😊\n\nSegue os dados do seu pedido em aberto:\n\n${detalhes}\n\n*Total: ${total}*\n\n💳 *Chave PIX:* ${PIX_CHAVE}\n👤 *${PIX_NOME}*\n\nQualquer dúvida, estou à disposição! 🎾`,

      // Template 2: Lembrete amigável
      `Oi, ${nome}! ${saudacao}! 👋\n\nPassando pra lembrar do valor em aberto:\n\n${detalhes}\n\n*Total: ${total}*\n\nPode transferir via PIX:\n💳 *${PIX_CHAVE}*\n👤 *${PIX_NOME}*\n\nObrigado! 🙏`,

      // Template 3: Direto ao ponto
      `${saudacao}, ${nome}!\n\nValor pendente: *${total}*\n\n${detalhes}\n\nPIX: *${PIX_CHAVE}*\n${PIX_NOME}\n\nAgradeço! 🎾`,
    ]

    return templates[template] || templates[0]
  }

  const abrirCobranca = (v: Venda) => {
    const msg = gerarMensagem(v, 0)
    setCobranca({ venda: v, template: 0 })
    setMsgCustom(msg)
  }

  const trocarTemplate = (template: number) => {
    if (!cobranca) return
    setCobranca({ ...cobranca, template })
    setMsgCustom(gerarMensagem(cobranca.venda, template))
  }

  const enviarWhatsApp = () => {
    if (!cobranca) return
    const tel = cobranca.venda.cliente.telefone.replace(/\D/g, '')
    const telFormatado = tel.startsWith('55') ? tel : `55${tel}`
    const url = `https://wa.me/${telFormatado}?text=${encodeURIComponent(msgCustom)}`
    window.open(url, '_blank')
    setCobranca(null)
    toast({ title: `Cobrança enviada para ${cobranca.venda.cliente.nome}`, type: 'success' })
  }

  const copiarMensagem = () => {
    navigator.clipboard.writeText(msgCustom)
    toast({ title: 'Mensagem copiada!', type: 'success' })
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

      {/* Lista de Vendas — pendentes primeiro, pagos embaixo */}
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
      ) : (() => {
        const pendentes = vendas.filter(v => v.pagamento?.status !== 'pago')
        const pagos = vendas.filter(v => v.pagamento?.status === 'pago')
        const vendasOrdenadas = [...pendentes, ...pagos]
        return (
        <div className="space-y-2">
          {/* Contadores */}
          {pendentes.length > 0 && pagos.length > 0 && (
            <div className="flex items-center gap-3 text-xs font-medium">
              <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
                {pendentes.length} pendente{pendentes.length !== 1 ? 's' : ''}
              </span>
              <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
                {pagos.length} pago{pagos.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          {/* Separador quando há pendentes */}
          {pendentes.length > 0 && pagos.length > 0 && (
            <p className="text-[10px] text-amber-600 font-semibold uppercase tracking-wider pt-1">Aguardando pagamento</p>
          )}
          {vendasOrdenadas.map((v, idx) => (
            <>{/* Separador entre pendentes e pagos */}
            {idx === pendentes.length && pendentes.length > 0 && pagos.length > 0 && (
              <p className="text-[10px] text-green-600 font-semibold uppercase tracking-wider pt-3">Pagos</p>
            )}
            <div key={v.id} className={`rounded-xl p-4 border transition-all duration-300 ${
              v.pagamento?.status === 'pago'
                ? 'bg-green-50/50 border-green-200 opacity-70'
                : 'bg-white border-gray-100 hover:border-emerald-200'
            }`}>
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
              {/* Ações: pagamento (se pendente) + nova venda */}
              <div className="mt-3 pt-3 border-t border-gray-50 space-y-2">
                {/* Botões de pagamento — só para vendas pendentes */}
                {v.pagamento && v.pagamento.status === 'pendente' && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <button onClick={() => marcarPago(v.pagamento!.id, 'pix', v.cliente.nome)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 transition-colors">
                        <Smartphone className="w-3.5 h-3.5" /> PIX
                      </button>
                      <button onClick={() => marcarPago(v.pagamento!.id, 'dinheiro', v.cliente.nome)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 transition-colors">
                        <Banknote className="w-3.5 h-3.5" /> Dinheiro
                      </button>
                      <button onClick={() => marcarPago(v.pagamento!.id, 'cartao', v.cliente.nome)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 transition-colors">
                        <CreditCard className="w-3.5 h-3.5" /> Cartão
                      </button>
                    </div>
                    <button onClick={() => abrirCobranca(v)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors">
                      <MessageCircle className="w-3.5 h-3.5" /> Cobrar via WhatsApp
                    </button>
                  </div>
                )}
                {/* Ação rápida: refazer venda */}
                <div className="flex gap-2">
                  <Link
                    href={`/encordoamento?clienteId=${v.cliente.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" /> Nova venda p/ {v.cliente.nome.split(' ')[0]}
                  </Link>
                </div>
              </div>
            </div>
          </>))}
        </div>
        )})()}

      {/* Modal Cobrança WhatsApp */}
      {cobranca && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl animate-slideUp max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h3 className="text-base font-bold text-gray-900">Cobrar via WhatsApp</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {cobranca.venda.cliente.nome} · {formatCurrency(cobranca.venda.preco)}
                </p>
              </div>
              <button onClick={() => setCobranca(null)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Templates */}
            <div className="flex gap-2 p-4 pb-2 flex-shrink-0">
              {['Gentil', 'Lembrete', 'Direto'].map((label, i) => (
                <button key={i} onClick={() => trocarTemplate(i)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                    cobranca.template === i
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>
                  {label}
                </button>
              ))}
            </div>

            {/* Mensagem editável */}
            <div className="px-4 py-2 flex-1 overflow-y-auto">
              <textarea
                value={msgCustom}
                onChange={e => setMsgCustom(e.target.value)}
                className="w-full h-56 px-3 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500 resize-none bg-gray-50 leading-relaxed"
              />
            </div>

            {/* Ações */}
            <div className="flex gap-3 p-4 border-t border-gray-100 flex-shrink-0">
              <button onClick={copiarMensagem}
                className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-600 font-medium hover:bg-gray-50 transition-colors">
                <Copy className="w-4 h-4" /> Copiar
              </button>
              <button onClick={enviarWhatsApp}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-colors">
                <Send className="w-4 h-4" /> Enviar WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
