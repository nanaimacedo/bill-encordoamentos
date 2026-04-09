'use client'

import { useEffect, useState, useCallback } from 'react'
import { Search, Download, Calendar, Package, Clock, CheckCircle, XCircle, RotateCcw, Filter, Check, CreditCard, Banknote, Smartphone, MessageCircle, X, Copy, Send, Trash2, MapPin, Eye, EyeOff } from 'lucide-react'
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
  totalRaquetes: number
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

const CENTROS = [
  { value: 'loja', label: 'Loja', color: 'bg-blue-50 text-blue-700' },
  { value: 'cooper', label: 'Cooper', color: 'bg-teal-50 text-teal-700' },
  { value: 'delivery', label: 'Delivery', color: 'bg-orange-50 text-orange-700' },
] as const

export default function VendasPage() {
  const [vendas, setVendas] = useState<Venda[]>([])
  const [resumo, setResumo] = useState<Resumo>({ quantidade: 0, total: 0, totalPago: 0, totalPendente: 0, totalRaquetes: 0 })
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState<string>('todos')
  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('todos')
  const [cobranca, setCobranca] = useState<{ venda: Venda; template: number } | null>(null)
  const [msgCustom, setMsgCustom] = useState('')
  const [editandoCentro, setEditandoCentro] = useState<string | null>(null)
  const [mostrarValores, setMostrarValores] = useState(false)
  // Snapshot dos IDs pendentes no momento do carregamento (pra manter a ordem fixa enquanto o usuário marca)
  const [idsPendentesSnap, setIdsPendentesSnap] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  const v$ = (valor: number) => mostrarValores ? formatCurrency(valor) : '•••••'

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ periodo, status: statusFiltro })
      if (busca) params.set('busca', busca)
      const res = await fetch(`/api/vendas?${params}`)
      const data = await res.json()
      const vendasApi: Venda[] = data.vendas || []
      setVendas(vendasApi)
      // Snapshot da ordem: pendentes primeiro, depois pagos
      setIdsPendentesSnap(new Set(vendasApi.filter(v => v.pagamento?.status !== 'pago').map(v => v.id)))
      setResumo(data.resumo || { quantidade: 0, total: 0, totalPago: 0, totalPendente: 0, totalRaquetes: 0 })
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
      `Raquetes: ${resumo.totalRaquetes}`,
      `Faturamento total: R$ ${resumo.total.toFixed(2)}`,
      `Recebido: R$ ${resumo.totalPago.toFixed(2)}`,
      `Pendente: R$ ${resumo.totalPendente.toFixed(2)}`,
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
    setVendas(prev => prev.map(v =>
      v.pagamento?.id === pagamentoId
        ? { ...v, pagamento: { ...v.pagamento, status: 'pago', formaPagamento: forma } }
        : v
    ))
    setResumo(prev => {
      const venda = vendas.find(v => v.pagamento?.id === pagamentoId)
      const valor = venda?.preco || 0
      return { ...prev, totalPago: prev.totalPago + valor, totalPendente: prev.totalPendente - valor }
    })
    try {
      const res = await fetch(`/api/pagamentos/${pagamentoId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'pago', formaPagamento: forma }),
      })
      if (!res.ok) { carregar(); throw new Error('Falha') }
      toast({ title: `${clienteNome} — ${forma.toUpperCase()}`, type: 'success' })
    } catch { toast({ title: 'Erro ao confirmar pagamento', type: 'error' }) }
  }

  const desfazerPagamento = async (pagamentoId: string, clienteNome: string, valor: number) => {
    setVendas(prev => prev.map(v =>
      v.pagamento?.id === pagamentoId
        ? { ...v, pagamento: { ...v.pagamento, status: 'pendente', formaPagamento: null } }
        : v
    ))
    setResumo(prev => ({ ...prev, totalPago: prev.totalPago - valor, totalPendente: prev.totalPendente + valor }))
    try {
      const res = await fetch(`/api/pagamentos/${pagamentoId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'pendente', formaPagamento: '' }),
      })
      if (!res.ok) { carregar(); throw new Error('Falha') }
      toast({ title: `${clienteNome} — voltou para pendente`, type: 'success' })
    } catch { toast({ title: 'Erro ao desfazer pagamento', type: 'error' }) }
  }

  const alterarCentro = async (vendaId: string, novoCentro: string) => {
    setVendas(prev => prev.map(v => v.id === vendaId ? { ...v, centroReceita: novoCentro, entrega: novoCentro === 'delivery' ? 'delivery' : 'retirada' } : v))
    setEditandoCentro(null)
    try {
      const res = await fetch(`/api/encordoamentos/${vendaId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ centroReceita: novoCentro, entrega: novoCentro === 'delivery' ? 'delivery' : 'retirada' }),
      })
      if (!res.ok) { carregar(); throw new Error('Falha') }
      toast({ title: `Centro → ${novoCentro.toUpperCase()}`, type: 'success' })
    } catch { toast({ title: 'Erro ao alterar centro', type: 'error' }) }
  }

  const excluirVenda = async (vendaId: string, clienteNome: string) => {
    if (!confirm(`Excluir venda de ${clienteNome}?`)) return
    setVendas(prev => prev.filter(v => v.id !== vendaId))
    setResumo(prev => {
      const venda = vendas.find(v => v.id === vendaId)
      const valor = venda?.preco || 0
      const isPago = venda?.pagamento?.status === 'pago'
      return {
        ...prev,
        quantidade: prev.quantidade - 1,
        total: prev.total - valor,
        totalPago: isPago ? prev.totalPago - valor : prev.totalPago,
        totalPendente: !isPago ? prev.totalPendente - valor : prev.totalPendente,
      }
    })
    try {
      await fetch(`/api/encordoamentos/${vendaId}`, { method: 'DELETE' })
      toast({ title: `Venda de ${clienteNome} excluída`, type: 'success' })
    } catch { toast({ title: 'Erro ao excluir', type: 'error' }); carregar() }
  }

  // --- Cobrança WhatsApp ---
  const PIX_CHAVE = '11952323401'
  const PIX_NOME = 'Elioenai P Macedo'
  const getPrimeiroNome = (nome: string) => nome.split(' ')[0]
  const getSaudacao = () => { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite' }

  const getDetalhesVenda = (v: Venda) => {
    const obs = v.observacoes || ''
    const prodMatch = obs.match(/Produto:\s*(.+?)(\s*\||$)/)
    const produto = prodMatch ? prodMatch[1].trim() : v.corda?.nome || 'Serviço'
    return `${produto}: ${formatCurrency(v.preco)}`
  }

  // Buscar todas as vendas pendentes do mesmo cliente para a cobrança
  const getVendasPendentesCliente = (clienteId: string) => {
    return vendas.filter(v => v.cliente.id === clienteId && v.pagamento?.status === 'pendente')
  }

  const gerarMensagem = (v: Venda, template: number): string => {
    const nome = getPrimeiroNome(v.cliente.nome)
    const saudacao = getSaudacao()
    // Pegar TODAS as vendas pendentes do cliente
    const pendentes = getVendasPendentesCliente(v.cliente.id)
    const detalhes = pendentes.map(p => {
      const obs = p.observacoes || ''
      const linhas: string[] = []

      // 1. Corda principal (encordoamento) — se tiver corda associada
      if (p.corda) {
        linhas.push(`Encordoar ${p.corda.nome}${p.tensao ? ` ${p.tensao}lbs` : ''}`)
      }

      // 2. Produto da planilha importada (vendas antigas)
      const prodMatch = obs.match(/Produto:\s*(.+?)(\s*\||$)/)
      if (prodMatch && !p.corda) {
        linhas.push(prodMatch[1].trim())
      }

      // 3. Extras de vendas novas (ex: "Extras: RPM Blast x2, Grip Yonex")
      const extrasMatch = obs.match(/Extras?:\s*(.+?)(\s*\||$)/)
      if (extrasMatch) {
        linhas.push(extrasMatch[1].trim())
      }

      // 4. Info híbrida
      const hibMatch = obs.match(/Híbrida:\s*(.+?)(\s*\||$)/)
      if (hibMatch) {
        linhas.push(hibMatch[1].trim())
      }

      // Fallback: se nada, usa "Serviço"
      const descricao = linhas.length > 0 ? linhas.join(' + ') : 'Serviço'
      return `• ${descricao}: ${formatCurrency(p.preco)}`
    }).join('\n')
    const totalPendente = pendentes.reduce((sum, p) => sum + p.preco, 0)
    const total = formatCurrency(totalPendente)

    const templates = [
      `${saudacao}, ${nome}! Tudo bem?! 😊\n\nSegue os itens em aberto:\n\n${detalhes}\n\n*Total: ${total}*\n\n💳 *Chave PIX:* ${PIX_CHAVE}\n👤 *${PIX_NOME}*\n\nQualquer dúvida, estou à disposição! 🎾`,
      `Oi, ${nome}! ${saudacao}! 👋\n\nPassando pra lembrar dos valores em aberto:\n\n${detalhes}\n\n*Total: ${total}*\n\nPode transferir via PIX:\n💳 *${PIX_CHAVE}*\n👤 *${PIX_NOME}*\n\nObrigado! 🙏`,
      `${saudacao}, ${nome}!\n\nValores pendentes:\n\n${detalhes}\n\n*Total: ${total}*\n\nPIX: *${PIX_CHAVE}*\n${PIX_NOME}\n\nAgradeço! 🎾`,
    ]
    return templates[template] || templates[0]
  }

  const abrirCobranca = (v: Venda) => {
    setCobranca({ venda: v, template: 0 })
    setMsgCustom(gerarMensagem(v, 0))
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
    window.open(`https://wa.me/${telFormatado}?text=${encodeURIComponent(msgCustom)}`, '_blank')
    setCobranca(null)
    toast({ title: `Cobrança enviada para ${cobranca.venda.cliente.nome}`, type: 'success' })
  }
  const copiarMensagem = () => { navigator.clipboard.writeText(msgCustom); toast({ title: 'Mensagem copiada!', type: 'success' }) }

  const getStatusIcon = (venda: Venda) => {
    if (venda.pagamento?.status === 'pago') return <CheckCircle className="w-4 h-4 text-green-500" />
    return <Clock className="w-4 h-4 text-amber-500" />
  }
  const getStatusLabel = (venda: Venda) => venda.pagamento?.status === 'pago' ? 'Pago' : 'Pendente'

  // Filtro por pagamento via badges
  const filtrarPorStatus = (status: string) => {
    if (statusFiltro === status) setStatusFiltro('todos')
    else setStatusFiltro(status)
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Vendas</h1>
        <div className="flex gap-2">
          <button onClick={() => setMostrarValores(v => !v)}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors" title={mostrarValores ? 'Ocultar valores' : 'Mostrar valores'}>
            {mostrarValores ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
          </button>
          <button onClick={carregar} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors" title="Atualizar">
            <RotateCcw className="w-4 h-4 text-gray-600" />
          </button>
          <button onClick={exportarCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 text-sm font-medium transition-colors">
            <Download className="w-4 h-4" /> CSV
          </button>
        </div>
      </div>

      {/* KPI Cards — clicáveis para filtrar */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
          <p className="text-xs text-blue-600 uppercase font-semibold">Vendas</p>
          <p className="text-xl font-bold text-blue-700">{resumo.quantidade}</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
          <p className="text-xs text-purple-600 uppercase font-semibold">Raquetes</p>
          <p className="text-xl font-bold text-purple-700">{resumo.totalRaquetes}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
          <p className="text-xs text-emerald-600 uppercase font-semibold">Total</p>
          <p className="text-xl font-bold text-emerald-700">{v$(resumo.total)}</p>
        </div>
        <button onClick={() => filtrarPorStatus('pago')}
          className={`rounded-xl p-3 border text-left transition-all ${
            statusFiltro === 'pago' ? 'ring-2 ring-green-500 border-green-300 bg-green-100' : 'bg-green-50 border-green-100'
          }`}>
          <p className="text-xs text-green-600 uppercase font-semibold">Recebido</p>
          <p className="text-xl font-bold text-green-700">{v$(resumo.totalPago)}</p>
        </button>
        <button onClick={() => filtrarPorStatus('pendente')}
          className={`rounded-xl p-3 border text-left transition-all ${
            statusFiltro === 'pendente' ? 'ring-2 ring-red-500 border-red-300 bg-red-100' : 'bg-red-50 border-red-100'
          }`}>
          <p className="text-xs text-red-600 uppercase font-semibold">Pendente</p>
          <p className="text-xl font-bold text-red-700">{v$(resumo.totalPendente)}</p>
        </button>
      </div>

      {/* Ticket médio */}
      {resumo.quantidade > 0 && (
        <div className="bg-white rounded-xl p-3 border border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-500">Ticket médio</span>
          <span className="text-sm font-bold text-gray-800">{v$(resumo.total / resumo.quantidade)}</span>
        </div>
      )}

      {/* Filtros */}
      <div className="space-y-3">
        <div className="flex gap-2 overflow-x-auto">
          {PERIODOS.map(p => (
            <button key={p.value} onClick={() => setPeriodo(p.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                periodo === p.value ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>{p.label}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Buscar cliente..." value={buscaDebounced}
              onChange={e => setBuscaDebounced(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          {statusFiltro !== 'todos' && (
            <button onClick={() => setStatusFiltro('todos')}
              className="px-3 py-2.5 rounded-lg bg-gray-200 text-gray-600 text-xs font-medium flex items-center gap-1">
              <X className="w-3 h-3" /> Limpar filtro
            </button>
          )}
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
      ) : (() => {
        const pendentesCount = vendas.filter(v => v.pagamento?.status !== 'pago').length
        const pagosCount = vendas.filter(v => v.pagamento?.status === 'pago').length
        // Ordena usando snapshot: tudo que estava pendente no carregamento vai primeiro (mantém ordem enquanto marca)
        const vendasOrdenadas = [
          ...vendas.filter(v => idsPendentesSnap.has(v.id)),
          ...vendas.filter(v => !idsPendentesSnap.has(v.id)),
        ]
        const ultimoPendenteIdx = vendasOrdenadas.findIndex(v => !idsPendentesSnap.has(v.id))
        return (
        <div className="space-y-2">
          {pendentesCount > 0 && pagosCount > 0 && (
            <div className="flex items-center gap-3 text-xs font-medium">
              <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">{pendentesCount} pendente{pendentesCount !== 1 ? 's' : ''}</span>
              <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full">{pagosCount} pago{pagosCount !== 1 ? 's' : ''}</span>
            </div>
          )}
          {vendasOrdenadas.map((v, idx) => (
            <div key={v.id}>
            {idx === 0 && idsPendentesSnap.size > 0 && (
              <p className="text-[10px] text-amber-600 font-semibold uppercase tracking-wider pt-1 pb-2">Pendentes</p>
            )}
            {idx === ultimoPendenteIdx && ultimoPendenteIdx > 0 && (
              <p className="text-[10px] text-green-600 font-semibold uppercase tracking-wider pt-3 pb-2">Pagos</p>
            )}
            <div className={`rounded-xl p-4 border transition-all duration-300 ${
              v.pagamento?.status === 'pago' ? 'bg-green-50/50 border-green-200 opacity-70' : 'bg-white border-gray-100 hover:border-emerald-200'
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
                    {/* Centro de receita — clicável para editar */}
                    {editandoCentro === v.id ? (
                      <div className="flex gap-1">
                        {CENTROS.map(c => (
                          <button key={c.value} onClick={() => alterarCentro(v.id, c.value)}
                            className={`px-2 py-0.5 rounded-full font-medium text-xs transition-all ${c.color} ${
                              v.centroReceita === c.value ? 'ring-2 ring-offset-1 ring-gray-400' : ''
                            }`}>{c.label}</button>
                        ))}
                        <button onClick={() => setEditandoCentro(null)} className="text-gray-400 ml-1"><X className="w-3 h-3" /></button>
                      </div>
                    ) : (
                      <button onClick={() => setEditandoCentro(v.id)}
                        className={`px-2 py-0.5 rounded-full font-medium ${
                          CENTROS.find(c => c.value === v.centroReceita)?.color || 'bg-blue-50 text-blue-700'
                        }`}>
                        {CENTROS.find(c => c.value === v.centroReceita)?.label || v.centroReceita === 'delivery' ? 'Delivery' : v.centroReceita === 'cooper' ? 'Cooper' : 'Loja'}
                      </button>
                    )}
                    {v.pagamento?.formaPagamento && v.pagamento.formaPagamento !== 'importado' && (
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
                  <p className={`text-lg font-bold ${v.pagamento?.status === 'pago' ? 'text-green-600' : 'text-red-600'}`}>
                    {v$(v.preco)}
                  </p>
                  <p className={`text-xs font-medium ${v.pagamento?.status === 'pago' ? 'text-green-500' : 'text-amber-500'}`}>
                    {getStatusLabel(v)}
                  </p>
                </div>
              </div>
              {/* Ações */}
              <div className="mt-3 pt-3 border-t border-gray-50 space-y-2">
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
                {v.pagamento && v.pagamento.status === 'pago' && (
                  <button onClick={() => desfazerPagamento(v.pagamento!.id, v.cliente.nome, v.preco)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium hover:bg-amber-100 transition-colors">
                    <XCircle className="w-3.5 h-3.5" /> Desfazer pagamento
                  </button>
                )}
                <div className="flex gap-2">
                  <Link href={`/encordoamento?clienteId=${v.cliente.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition-colors">
                    <RotateCcw className="w-3 h-3" /> Nova venda
                  </Link>
                  <button onClick={() => excluirVenda(v.id, v.cliente.nome)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors">
                    <Trash2 className="w-3 h-3" /> Excluir
                  </button>
                </div>
              </div>
            </div>
            </div>
          ))}
        </div>
        )})()}

      {/* Modal Cobrança WhatsApp */}
      {cobranca && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl animate-slideUp max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h3 className="text-base font-bold text-gray-900">Cobrar via WhatsApp</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {cobranca.venda.cliente.nome} · {getVendasPendentesCliente(cobranca.venda.cliente.id).length} itens pendentes
                </p>
              </div>
              <button onClick={() => setCobranca(null)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="flex gap-2 p-4 pb-2 flex-shrink-0">
              {['Gentil', 'Lembrete', 'Direto'].map((label, i) => (
                <button key={i} onClick={() => trocarTemplate(i)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                    cobranca.template === i ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>{label}</button>
              ))}
            </div>
            <div className="px-4 py-2 flex-1 overflow-y-auto">
              <textarea value={msgCustom} onChange={e => setMsgCustom(e.target.value)}
                className="w-full h-56 px-3 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500 resize-none bg-gray-50 leading-relaxed" />
            </div>
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
