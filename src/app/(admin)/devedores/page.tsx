'use client'

import { useEffect, useState, useCallback } from 'react'
import { AlertTriangle, MessageCircle, Phone, Clock, DollarSign, Eye, EyeOff, TrendingDown, X, Copy, Send, Bell, BellOff, History, FileText, Search } from 'lucide-react'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { useToast } from '@/components/Toast'
import { registerAdminPushSubscription, unregisterAdminPushSubscription, getAdminPushStatus } from '@/lib/push'

interface ItemDivida {
  id: string
  valor: number
  createdAt: string
  encordoamentoId: string | null
  produto: string
}

interface Devedor {
  cliente: { id: string; nome: string; telefone: string; centroReceita: string | null }
  totalDevido: number
  quantidade: number
  dividaMaisAntiga: string
  diasAtraso: number
  itens: ItemDivida[]
}

interface Resumo {
  totalGeral: number
  totalClientes: number
  dividasMaisAntigas: number
}

const PIX_CHAVE = '11952323401'
const PIX_NOME = 'Elioenai P Macedo'

export default function DevedoresPage() {
  const [devedores, setDevedores] = useState<Devedor[]>([])
  const [resumo, setResumo] = useState<Resumo>({ totalGeral: 0, totalClientes: 0, dividasMaisAntigas: 0 })
  const [loading, setLoading] = useState(true)
  const [mostrarValores, setMostrarValores] = useState(false)
  const [filtro, setFiltro] = useState<'todos' | 'antigos' | 'altos'>('todos')
  const [busca, setBusca] = useState('')
  const [cobrando, setCobrando] = useState<Devedor | null>(null)
  const [msgCustom, setMsgCustom] = useState('')
  const [template, setTemplate] = useState(0)
  const [pushAtivo, setPushAtivo] = useState(false)
  const [registrandoTentativa, setRegistrandoTentativa] = useState<Devedor | null>(null)
  const [formTentativa, setFormTentativa] = useState({ canal: 'whatsapp', resultado: 'enviado', observacao: '' })
  const [historicoCliente, setHistoricoCliente] = useState<any[] | null>(null)
  const { toast } = useToast()

  const v$ = (valor: number) => mostrarValores ? formatCurrency(valor) : '•••••'

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/devedores')
      const data = await res.json()
      setDevedores(data.devedores || [])
      setResumo(data.resumo || { totalGeral: 0, totalClientes: 0, dividasMaisAntigas: 0 })
    } catch {
      toast({ title: 'Erro ao carregar devedores', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { carregar() }, [carregar])

  // Verificar status das notificações push
  useEffect(() => {
    getAdminPushStatus().then(s => setPushAtivo(s.ativo))
  }, [])

  const togglePush = async () => {
    if (pushAtivo) {
      const r = await unregisterAdminPushSubscription()
      if (r.success) {
        setPushAtivo(false)
        toast({ title: 'Notificações desativadas', type: 'success' })
      }
    } else {
      const r = await registerAdminPushSubscription()
      if (r.success) {
        setPushAtivo(true)
        toast({ title: 'Notificações ativadas! Você receberá avisos de pendentes.', type: 'success' })
      } else {
        toast({ title: r.error || 'Erro ao ativar', type: 'error' })
      }
    }
  }

  const abrirRegistroTentativa = (d: Devedor) => {
    setRegistrandoTentativa(d)
    setFormTentativa({ canal: 'whatsapp', resultado: 'enviado', observacao: '' })
  }

  const salvarTentativa = async () => {
    if (!registrandoTentativa) return
    try {
      await fetch('/api/tentativas-cobranca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId: registrandoTentativa.cliente.id,
          canal: formTentativa.canal,
          resultado: formTentativa.resultado,
          observacao: formTentativa.observacao,
        }),
      })
      toast({ title: 'Cobrança registrada!', type: 'success' })
      setRegistrandoTentativa(null)
    } catch {
      toast({ title: 'Erro ao registrar', type: 'error' })
    }
  }

  const verHistorico = async (clienteId: string) => {
    try {
      const res = await fetch(`/api/tentativas-cobranca?clienteId=${clienteId}`)
      const data = await res.json()
      setHistoricoCliente(data)
    } catch {
      toast({ title: 'Erro ao carregar histórico', type: 'error' })
    }
  }

  const getSaudacao = () => {
    const h = new Date().getHours()
    return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
  }

  const getPrimeiroNome = (nome: string) => nome.split(' ')[0]

  const gerarMensagem = (d: Devedor, tpl: number) => {
    const nome = getPrimeiroNome(d.cliente.nome)
    const saudacao = getSaudacao()
    const detalhes = d.itens
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map(i => `• ${i.produto} (${formatDate(i.createdAt)}): ${formatCurrency(i.valor)}`)
      .join('\n')
    const total = formatCurrency(d.totalDevido)

    const templates = [
      `${saudacao}, ${nome}! Tudo bem?! 😊\n\nSegue os itens em aberto:\n\n${detalhes}\n\n*Total: ${total}*\n\n💳 *Chave PIX:* ${PIX_CHAVE}\n👤 *${PIX_NOME}*\n\nQualquer dúvida, estou à disposição! 🎾`,
      `Oi, ${nome}! ${saudacao}! 👋\n\nPassando pra lembrar dos valores em aberto (alguns já antigos):\n\n${detalhes}\n\n*Total: ${total}*\n\nPode transferir via PIX:\n💳 *${PIX_CHAVE}*\n👤 *${PIX_NOME}*\n\nObrigado! 🙏`,
      `${saudacao}, ${nome}!\n\nLembrete de valores pendentes:\n\n${detalhes}\n\n*Total: ${total}*\n\nPIX: *${PIX_CHAVE}*\n${PIX_NOME}\n\nAgradeço! 🎾`,
    ]
    return templates[tpl] || templates[0]
  }

  const abrirCobranca = (d: Devedor) => {
    setCobrando(d)
    setTemplate(0)
    setMsgCustom(gerarMensagem(d, 0))
  }

  const trocarTemplate = (tpl: number) => {
    if (!cobrando) return
    setTemplate(tpl)
    setMsgCustom(gerarMensagem(cobrando, tpl))
  }

  const enviarWhatsApp = () => {
    if (!cobrando) return
    const tel = cobrando.cliente.telefone.replace(/\D/g, '')
    const telFormatado = tel.startsWith('55') ? tel : `55${tel}`
    window.open(`https://wa.me/${telFormatado}?text=${encodeURIComponent(msgCustom)}`, '_blank')
    setCobrando(null)
    toast({ title: `Cobrança enviada para ${cobrando.cliente.nome}`, type: 'success' })
  }

  const copiarMensagem = () => {
    navigator.clipboard.writeText(msgCustom)
    toast({ title: 'Mensagem copiada!', type: 'success' })
  }

  // Filtros + busca por nome
  const buscaNormalizada = busca.trim().toLowerCase()
  const devedoresFiltrados = devedores.filter(d => {
    if (buscaNormalizada && !d.cliente.nome.toLowerCase().includes(buscaNormalizada)) return false
    if (filtro === 'antigos') return d.diasAtraso >= 30
    if (filtro === 'altos') return d.totalDevido >= 200
    return true
  })

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-red-500" /> Devedores
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Maiores valores em aberto</p>
        </div>
        <div className="flex gap-2">
          <button onClick={togglePush}
            className={`p-2 rounded-lg transition-colors ${pushAtivo ? 'bg-emerald-100 hover:bg-emerald-200' : 'bg-gray-100 hover:bg-gray-200'}`}
            title={pushAtivo ? 'Notificações ativadas' : 'Ativar notificações'}>
            {pushAtivo ? <Bell className="w-4 h-4 text-emerald-600" /> : <BellOff className="w-4 h-4 text-gray-400" />}
          </button>
          <button onClick={() => setMostrarValores(v => !v)}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
            {mostrarValores ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
          </button>
        </div>
      </div>

      {/* Banner de Push Notifications */}
      {!pushAtivo && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Bell className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p className="text-xs text-emerald-800">
              <strong>Ative notificações</strong> para receber avisos diários de pendentes no seu celular (mesmo com a tela bloqueada)
            </p>
          </div>
          <button onClick={togglePush}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 flex-shrink-0">
            Ativar
          </button>
        </div>
      )}

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-red-50 rounded-xl p-3 border border-red-100">
          <p className="text-xs text-red-600 uppercase font-semibold">Total a Receber</p>
          <p className="text-xl font-bold text-red-700">{v$(resumo.totalGeral)}</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
          <p className="text-xs text-amber-600 uppercase font-semibold">Clientes</p>
          <p className="text-xl font-bold text-amber-700">{resumo.totalClientes}</p>
        </div>
        <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
          <p className="text-xs text-orange-600 uppercase font-semibold">+30 dias</p>
          <p className="text-xl font-bold text-orange-700">{resumo.dividasMaisAntigas}</p>
        </div>
      </div>

      {/* Busca por nome */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar devedor por nome..."
          className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-200 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
        {busca && (
          <button
            onClick={() => setBusca('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-100"
            aria-label="Limpar busca"
          >
            <X className="w-3.5 h-3.5 text-gray-400" />
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto">
        {[
          { value: 'todos', label: 'Todos', count: devedores.length },
          { value: 'antigos', label: '+30 dias', count: devedores.filter(d => d.diasAtraso >= 30).length },
          { value: 'altos', label: 'Acima de R$200', count: devedores.filter(d => d.totalDevido >= 200).length },
        ].map(f => (
          <button key={f.value} onClick={() => setFiltro(f.value as typeof filtro)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              filtro === f.value ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-xl p-4 animate-pulse h-28" />)}
        </div>
      ) : devedoresFiltrados.length === 0 ? (
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Nenhum devedor encontrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {devedoresFiltrados.map((d, idx) => (
            <div key={d.cliente.id} className={`bg-white rounded-xl p-4 border transition-colors ${
              d.diasAtraso >= 60 ? 'border-red-300 bg-red-50/30' :
              d.diasAtraso >= 30 ? 'border-amber-200 bg-amber-50/30' :
              'border-gray-100 hover:border-emerald-200'
            }`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {idx < 3 && (
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                        idx === 0 ? 'bg-red-500' : idx === 1 ? 'bg-orange-500' : 'bg-amber-500'
                      }`}>{idx + 1}</span>
                    )}
                    <p className="font-semibold text-sm text-gray-800 truncate">{d.cliente.nome}</p>
                    {d.cliente.centroReceita && (
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded uppercase">
                        {d.cliente.centroReceita}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {d.cliente.telefone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {d.cliente.telefone}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {d.diasAtraso} dia{d.diasAtraso !== 1 ? 's' : ''}
                    </span>
                    <span>{d.quantidade} item{d.quantidade !== 1 ? 'ns' : ''}</span>
                  </div>
                </div>
                <div className="text-right ml-3 flex-shrink-0">
                  <p className="text-lg font-bold text-red-600">{v$(d.totalDevido)}</p>
                  <p className="text-[10px] text-gray-400">desde {formatDate(d.dividaMaisAntiga)}</p>
                </div>
              </div>

              {/* Itens da dívida */}
              <div className="bg-gray-50 rounded-lg p-2 space-y-1 text-xs">
                {d.itens.slice(0, 3).map(i => (
                  <div key={i.id} className="flex justify-between text-gray-600">
                    <span className="truncate mr-2">{i.produto} · {formatDate(i.createdAt)}</span>
                    <span className="font-semibold flex-shrink-0">{v$(i.valor)}</span>
                  </div>
                ))}
                {d.itens.length > 3 && (
                  <p className="text-[10px] text-gray-400 text-center">+ {d.itens.length - 3} item{d.itens.length - 3 > 1 ? 'ns' : ''}</p>
                )}
              </div>

              {/* Ações */}
              <div className="mt-2 flex gap-2">
                <button onClick={() => abrirCobranca(d)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors">
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                </button>
                <button onClick={() => abrirRegistroTentativa(d)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors"
                  title="Registrar cobrança">
                  <FileText className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => verHistorico(d.cliente.id)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gray-50 text-gray-700 text-xs font-medium hover:bg-gray-100 transition-colors"
                  title="Histórico de cobranças">
                  <History className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Cobrança */}
      {cobrando && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl animate-slideUp max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h3 className="text-base font-bold text-gray-900">Cobrar via WhatsApp</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {cobrando.cliente.nome} · {formatCurrency(cobrando.totalDevido)}
                </p>
              </div>
              <button onClick={() => setCobrando(null)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="flex gap-2 p-4 pb-2 flex-shrink-0">
              {['Gentil', 'Lembrete', 'Direto'].map((label, i) => (
                <button key={i} onClick={() => trocarTemplate(i)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                    template === i ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                <Send className="w-4 h-4" /> Enviar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Registrar Tentativa de Cobrança */}
      {registrandoTentativa && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl animate-slideUp">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">Registrar Cobrança</h3>
                <p className="text-xs text-gray-500 mt-0.5">{registrandoTentativa.cliente.nome}</p>
              </div>
              <button onClick={() => setRegistrandoTentativa(null)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Canal</label>
                <div className="grid grid-cols-4 gap-1.5 mt-1">
                  {['whatsapp', 'telefone', 'pessoal', 'sms'].map(c => (
                    <button key={c} onClick={() => setFormTentativa(p => ({ ...p, canal: c }))}
                      className={`py-2 rounded-lg text-xs font-medium transition-all ${
                        formTentativa.canal === c ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>{c.charAt(0).toUpperCase() + c.slice(1)}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Resultado</label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {[
                    { v: 'enviado', l: 'Enviado' },
                    { v: 'visualizado', l: 'Visualizado' },
                    { v: 'respondeu', l: 'Respondeu' },
                    { v: 'prometeu_pagar', l: 'Prometeu pagar' },
                    { v: 'sem_resposta', l: 'Sem resposta' },
                  ].map(r => (
                    <button key={r.v} onClick={() => setFormTentativa(p => ({ ...p, resultado: r.v }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        formTentativa.resultado === r.v ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>{r.l}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Observação</label>
                <textarea value={formTentativa.observacao}
                  onChange={e => setFormTentativa(p => ({ ...p, observacao: e.target.value }))}
                  placeholder="Ex: Vai pagar na sexta, disse que esqueceu..."
                  rows={3}
                  className="w-full mt-1 px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 p-4 border-t border-gray-100">
              <button onClick={() => setRegistrandoTentativa(null)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-600 font-medium">Cancelar</button>
              <button onClick={salvarTentativa}
                className="flex-1 py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Histórico */}
      {historicoCliente && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl animate-slideUp max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="text-base font-bold text-gray-900">Histórico de Cobranças</h3>
              <button onClick={() => setHistoricoCliente(null)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {historicoCliente.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">Nenhuma cobrança registrada ainda</p>
              ) : (
                <div className="space-y-2">
                  {historicoCliente.map((t: any) => (
                    <div key={t.id} className="bg-gray-50 rounded-lg p-3 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-gray-800 uppercase">{t.canal}</span>
                        <span className="text-gray-400">{formatDateTime(t.createdAt)}</span>
                      </div>
                      <p className="text-gray-600">Resultado: <span className="font-medium">{t.resultado.replace('_', ' ')}</span></p>
                      {t.observacao && <p className="text-gray-500 mt-1 italic">&ldquo;{t.observacao}&rdquo;</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
