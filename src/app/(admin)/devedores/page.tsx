'use client'

import { useEffect, useState, useCallback } from 'react'
import { AlertTriangle, MessageCircle, Phone, Clock, DollarSign, Eye, EyeOff, TrendingDown, X, Copy, Send } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useToast } from '@/components/Toast'

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
  const [cobrando, setCobrando] = useState<Devedor | null>(null)
  const [msgCustom, setMsgCustom] = useState('')
  const [template, setTemplate] = useState(0)
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

  // Filtros
  const devedoresFiltrados = devedores.filter(d => {
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
        <button onClick={() => setMostrarValores(v => !v)}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
          {mostrarValores ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
        </button>
      </div>

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

              {/* Ação */}
              <button onClick={() => abrirCobranca(d)}
                className="w-full mt-2 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors">
                <MessageCircle className="w-3.5 h-3.5" /> Cobrar via WhatsApp
              </button>
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
    </div>
  )
}
