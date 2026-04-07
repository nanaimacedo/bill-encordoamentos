'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import { Search, RotateCcw, Check, Plus, Truck, Package, X, ChevronDown, Paintbrush, Sparkles, Shield, Circle, Grip, Disc, Wrench } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/components/Toast'

interface Cliente {
  id: string
  nome: string
  telefone: string
  condominio: string | null
  apartamento: string | null
}

interface Corda {
  id: string
  nome: string
  marca: string
  tipo: string
  calibre: string
  preco: number
}

interface LastEncordoamento {
  cordaId: string
  tensao: number
  tensaoCross: number | null
  tipo: string
  preco: number
  corda: { nome: string; marca: string }
}

const TENSOES_MAIN = [39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60]

// Serviços simples (sem variações de marca)
const SERVICOS_SIMPLES: { id: string; nome: string; preco: number; iconKey: string }[] = [
  { id: 'pintar_logo', nome: 'Pintar Logo', preco: 0, iconKey: 'paintbrush' },
  { id: 'limpeza', nome: 'Limpeza Raquete', preco: 0, iconKey: 'sparkles' },
]

// Serviços com variações de marca (abre sub-menu)
const SERVICOS_COM_MARCA = [
  {
    id: 'overgrip', nome: 'Overgrip', iconKey: 'circle',
    opcoes: [
      { id: 'overgrip_wilson_pro', nome: 'Wilson Pro', preco: 15 },
      { id: 'overgrip_babolat_vs', nome: 'Babolat VS Dry', preco: 18 },
      { id: 'overgrip_yonex_supergrap', nome: 'Yonex Super Grap', preco: 16 },
      { id: 'overgrip_head_xtreme', nome: 'Head Xtreme Soft', preco: 14 },
    ],
  },
  {
    id: 'antivibrador', nome: 'Antivibrador', iconKey: 'disc',
    opcoes: [
      { id: 'anti_wilson', nome: 'Wilson Shock Shield', preco: 12 },
      { id: 'anti_babolat', nome: 'Babolat Custom Damp', preco: 15 },
      { id: 'anti_head', nome: 'Head Djokovic', preco: 10 },
    ],
  },
  {
    id: 'cushion_grip', nome: 'Cushion Grip', iconKey: 'grip',
    opcoes: [
      { id: 'cushion_wilson', nome: 'Wilson Premium', preco: 30 },
      { id: 'cushion_babolat', nome: 'Babolat Syntec Pro', preco: 35 },
      { id: 'cushion_yonex', nome: 'Yonex Premium', preco: 28 },
      { id: 'cushion_head', nome: 'Head Hydrosorb Pro', preco: 32 },
    ],
  },
  {
    id: 'fita_protetora', nome: 'Fita Protetora', iconKey: 'shield',
    opcoes: [
      { id: 'fita_wilson', nome: 'Wilson', preco: 12 },
      { id: 'fita_head', nome: 'Head', preco: 10 },
      { id: 'fita_babolat', nome: 'Babolat', preco: 14 },
    ],
  },
]

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  paintbrush: Paintbrush,
  sparkles: Sparkles,
  shield: Shield,
  circle: Circle,
  grip: Grip,
  disc: Disc,
  wrench: Wrench,
}

export default function NovoEncordoamentoPageWrapper() {
  return (
    <Suspense fallback={<div className="p-4 text-center text-gray-400">Carregando...</div>}>
      <NovoEncordoamentoPage />
    </Suspense>
  )
}

function NovoEncordoamentoPage() {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [cordas, setCordas] = useState<Corda[]>([])
  const [busca, setBusca] = useState('')
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [tipoEnc, setTipoEnc] = useState<'padrao' | 'hibrida'>('padrao')
  const [cordaSelecionada, setCordaSelecionada] = useState<string>('') // main
  const [cordaCross, setCordaCross] = useState<string>('') // cruzadas (híbrida)
  const [tensao, setTensao] = useState<number>(55) // main
  const [tensaoCross, setTensaoCross] = useState<number>(53) // cruzadas
  const [preco, setPreco] = useState<number>(0)
  const [observacoes, setObservacoes] = useState('')
  const [entrega, setEntrega] = useState<'retirada' | 'delivery'>('retirada')
  const [enderecoEntrega, setEnderecoEntrega] = useState('')
  const [taxaDelivery, setTaxaDelivery] = useState<number>(10)
  const [servicosExtras, setServicosExtras] = useState<Set<string>>(new Set())
  const [menuAberto, setMenuAberto] = useState<string | null>(null)
  const [selecoesComMarca, setSelecoesComMarca] = useState<Record<string, { id: string; nome: string; preco: number }>>({})
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [lastEnc, setLastEnc] = useState<LastEncordoamento | null>(null)
  const [showNovoCliente, setShowNovoCliente] = useState(false)
  const [novoCliente, setNovoCliente] = useState({ nome: '', telefone: '', condominio: '', apartamento: '' })

  // Auto-selecionar cliente via query param
  useEffect(() => {
    const clienteId = searchParams.get('clienteId')
    if (clienteId) {
      fetch(`/api/clientes/${clienteId}`)
        .then(r => r.json())
        .then(c => {
          if (c && c.id) {
            setClienteSelecionado(c)
            setBusca(c.nome)
            setShowModal(true)
          }
        })
        .catch(() => {})
    }
  }, [searchParams])

  const buscarClientes = useCallback(async (q: string) => {
    const res = await fetch(`/api/clientes?q=${encodeURIComponent(q)}`)
    setClientes(await res.json())
  }, [])

  // Carregar últimos clientes e cordas ao abrir
  useEffect(() => {
    fetch('/api/cordas').then(r => r.json()).then(setCordas)
    buscarClientes('') // carrega todos os clientes
  }, [buscarClientes])

  useEffect(() => {
    const t = setTimeout(() => buscarClientes(busca), 200)
    return () => clearTimeout(t)
  }, [busca, buscarClientes])

  useEffect(() => {
    if (!clienteSelecionado) { setLastEnc(null); return }
    fetch(`/api/encordoamentos/repetir/${clienteSelecionado.id}`)
      .then(r => r.json())
      .then(data => { if (data?.id) setLastEnc(data); else setLastEnc(null) })
      .catch(() => setLastEnc(null))
    if (clienteSelecionado.condominio) {
      setEnderecoEntrega(`${clienteSelecionado.condominio}${clienteSelecionado.apartamento ? ` - Apt ${clienteSelecionado.apartamento}` : ''}`)
    }
  }, [clienteSelecionado])

  useEffect(() => {
    const cordaMain = cordas.find(c => c.id === cordaSelecionada)
    if (tipoEnc === 'hibrida') {
      const cordaCr = cordas.find(c => c.id === cordaCross)
      const p1 = cordaMain ? cordaMain.preco / 2 : 0
      const p2 = cordaCr ? cordaCr.preco / 2 : 0
      setPreco(Math.round((p1 + p2) * 100) / 100)
    } else {
      if (cordaMain) setPreco(cordaMain.preco)
    }
  }, [cordaSelecionada, cordaCross, cordas, tipoEnc])

  const toggleServicoSimples = (id: string) => {
    setServicosExtras(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const selecionarOpcaoMarca = (categoriaId: string, opcao: { id: string; nome: string; preco: number }) => {
    setSelecoesComMarca(prev => ({ ...prev, [categoriaId]: opcao }))
    setMenuAberto(null)
  }

  const removerMarca = (categoriaId: string) => {
    setSelecoesComMarca(prev => {
      const next = { ...prev }
      delete next[categoriaId]
      return next
    })
  }

  const totalSimples = SERVICOS_SIMPLES.filter(s => servicosExtras.has(s.id)).reduce((sum, s) => sum + s.preco, 0)
  const totalMarca = Object.values(selecoesComMarca).reduce((sum, s) => sum + s.preco, 0)
  const totalExtras = totalSimples + totalMarca
  const precoServico = preco
  const precoDelivery = entrega === 'delivery' ? taxaDelivery : 0
  const precoTotal = precoServico + totalExtras + precoDelivery

  const repetirUltimo = () => {
    if (!lastEnc) return
    setCordaSelecionada(lastEnc.cordaId)
    setTensao(lastEnc.tensao)
    setPreco(lastEnc.preco)
  }

  const selecionarCliente = (c: Cliente) => {
    setClienteSelecionado(c)
    setBusca(c.nome)
    setShowModal(true)
  }

  const resetForm = () => {
    setShowModal(false)
    setClienteSelecionado(null)
    setTipoEnc('padrao')
    setCordaSelecionada('')
    setCordaCross('')
    setTensao(55)
    setTensaoCross(53)
    setPreco(0)
    setObservacoes('')
    setEntrega('retirada')
    setEnderecoEntrega('')
    setServicosExtras(new Set())
    setSelecoesComMarca({})
    setMenuAberto(null)
    setBusca('')
    setLastEnc(null)
  }

  const salvar = async () => {
    if (!clienteSelecionado || !cordaSelecionada) return
    setSalvando(true)
    const extrasSimples = SERVICOS_SIMPLES.filter(s => servicosExtras.has(s.id)).map(s => s.nome)
    const extrasComMarca = Object.entries(selecoesComMarca).map(([cat, opt]) => {
      const categoria = SERVICOS_COM_MARCA.find(s => s.id === cat)
      return `${categoria?.nome}: ${opt.nome}`
    })
    const extras = [...extrasSimples, ...extrasComMarca].join(', ')
    try {
      const cordaCrObj = cordas.find(c => c.id === cordaCross)
      const hibridaInfo = tipoEnc === 'hibrida' && cordaCrObj
        ? `Híbrida: Cruzadas ${cordaCrObj.nome} ${tensaoCross}lbs`
        : ''
      const res = await fetch('/api/encordoamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId: clienteSelecionado.id,
          cordaId: cordaSelecionada,
          tensao,
          tensaoCross: tipoEnc === 'hibrida' ? tensaoCross : null,
          preco: precoTotal,
          observacoes: [observacoes, hibridaInfo, extras ? `Extras: ${extras}` : ''].filter(Boolean).join(' | '),
          tipo: tipoEnc,
          entrega,
          enderecoEntrega: entrega === 'delivery' ? enderecoEntrega : '',
          taxaDelivery: precoDelivery,
          centroReceita: entrega === 'delivery' ? 'delivery' : (clienteSelecionado as any).centroReceita || 'loja',
        }),
      })
      if (res.ok) {
        toast({ title: 'Encordoamento registrado com sucesso!', type: 'success' })
        setSucesso(true)
        setTimeout(() => { setSucesso(false); resetForm() }, 1500)
      } else {
        toast({ title: 'Erro ao registrar encordoamento', type: 'error' })
      }
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro ao registrar encordoamento', type: 'error' })
    }
    finally { setSalvando(false) }
  }

  const criarCliente = async () => {
    if (!novoCliente.nome || !novoCliente.telefone) return
    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoCliente),
      })
      if (!res.ok) throw new Error('Falha ao criar cliente')
      const cliente = await res.json()
      toast({ title: 'Cliente criado com sucesso!', type: 'success' })
      setShowNovoCliente(false)
      setNovoCliente({ nome: '', telefone: '', condominio: '', apartamento: '' })
      selecionarCliente(cliente)
    } catch {
      toast({ title: 'Erro ao criar cliente', type: 'error' })
    }
  }

  const cordaSel = cordas.find(c => c.id === cordaSelecionada)
  const cordaCrossSel = cordas.find(c => c.id === cordaCross)

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-heading">Novo Serviço</h1>
          <p className="text-sm text-gray-500">Selecione o cliente para iniciar</p>
        </div>
      </div>

      {/* Client search */}
      <div className="relative">
        <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar cliente por nome ou telefone..."
          value={busca}
          onChange={e => { setBusca(e.target.value); setClienteSelecionado(null) }}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm bg-white shadow-sm"
          autoFocus
        />
      </div>

      {clientes.length > 0 && !showModal && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            {busca ? `Resultados para "${busca}"` : 'Clientes recentes'}
          </p>
          <div className="bg-white rounded-xl border border-gray-200 divide-y max-h-[50vh] overflow-y-auto shadow-sm">
            {clientes.map(c => (
              <button
                key={c.id}
                onClick={() => selecionarCliente(c)}
                className="w-full text-left px-4 py-3 hover:bg-emerald-50 transition-colors flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-sm text-gray-800">{c.nome}</p>
                  <p className="text-xs text-gray-500">{c.telefone}</p>
                </div>
                <span className="text-xs text-emerald-600 font-medium">Selecionar</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setShowNovoCliente(true)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-emerald-500 hover:text-emerald-600 transition-colors text-sm"
      >
        <Plus className="w-4 h-4" /> Novo Cliente
      </button>

      {/* ===== MODAL PRINCIPAL - Registro de Serviço ===== */}
      {showModal && clienteSelecionado && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-8 md:pt-16 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-slideUp mb-8">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900 font-heading">Novo Serviço</h2>
                <p className="text-xs text-gray-500 mt-0.5">{clienteSelecionado.nome} · {clienteSelecionado.telefone}</p>
              </div>
              <button onClick={resetForm} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Repetir último */}
              {lastEnc && (
                <button onClick={repetirUltimo}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-50 text-blue-700 font-medium text-sm hover:bg-blue-100 transition-colors border border-blue-200"
                >
                  <RotateCcw className="w-4 h-4" />
                  Repetir: {lastEnc.corda.nome} · {lastEnc.tensao}lbs · {formatCurrency(lastEnc.preco)}
                </button>
              )}

              {/* SEÇÃO: Tipo de Encordoamento */}
              <div>
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">Tipo</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => { setTipoEnc('padrao'); setCordaCross('') }}
                    className={`py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                      tipoEnc === 'padrao' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600'
                    }`}>
                    Padrão
                  </button>
                  <button onClick={() => setTipoEnc('hibrida')}
                    className={`py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                      tipoEnc === 'hibrida' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-600'
                    }`}>
                    Híbrida
                  </button>
                </div>
              </div>

              {/* SEÇÃO: Corda Principal (Main) */}
              <div>
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">
                  {tipoEnc === 'hibrida' ? 'Corda Principal (Mains)' : 'Corda'}
                </p>
                <select value={cordaSelecionada} onChange={e => setCordaSelecionada(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white appearance-none cursor-pointer font-medium">
                  <option value="">Selecione a corda...</option>
                  {cordas.map(c => (
                    <option key={c.id} value={c.id}>{c.nome} — {c.marca} ({c.tipo}) · {formatCurrency(c.preco)}</option>
                  ))}
                </select>
                {cordaSel && (
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">{cordaSel.marca}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{cordaSel.tipo}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{cordaSel.calibre}mm</span>
                  </div>
                )}
              </div>

              {/* SEÇÃO: Corda Cruzadas (Cross) - apenas em híbrida */}
              {tipoEnc === 'hibrida' && (
                <div>
                  <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2">Corda Cruzadas (Crosses)</p>
                  <select value={cordaCross} onChange={e => setCordaCross(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-purple-200 text-sm outline-none focus:ring-2 focus:ring-purple-500 bg-white appearance-none cursor-pointer font-medium">
                    <option value="">Selecione a corda cruzada...</option>
                    {cordas.map(c => (
                      <option key={c.id} value={c.id}>{c.nome} — {c.marca} ({c.tipo}) · {formatCurrency(c.preco)}</option>
                    ))}
                  </select>
                  {cordaCrossSel && (
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">{cordaCrossSel.marca}</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{cordaCrossSel.tipo}</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{cordaCrossSel.calibre}mm</span>
                    </div>
                  )}
                </div>
              )}

              {/* SEÇÃO: Tensão Principal */}
              <div>
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">
                  {tipoEnc === 'hibrida' ? 'Tensão Mains' : 'Tensão'} · <span className="text-gray-800 text-sm">{tensao} lbs</span>
                </p>
                <div className="grid grid-cols-6 sm:grid-cols-7 gap-1.5">
                  {TENSOES_MAIN.map(t => (
                    <button key={t} onClick={() => setTensao(t)}
                      className={`py-2.5 rounded-lg text-sm font-semibold transition-all ${
                        tensao === t
                          ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* SEÇÃO: Tensão Cruzadas - apenas em híbrida */}
              {tipoEnc === 'hibrida' && (
                <div>
                  <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2">
                    Tensão Crosses · <span className="text-gray-800 text-sm">{tensaoCross} lbs</span>
                  </p>
                  <div className="grid grid-cols-6 sm:grid-cols-7 gap-1.5">
                    {TENSOES_MAIN.map(t => (
                      <button key={t} onClick={() => setTensaoCross(t)}
                        className={`py-2.5 rounded-lg text-sm font-semibold transition-all ${
                          tensaoCross === t
                            ? 'bg-purple-600 text-white shadow-sm shadow-purple-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* SEÇÃO: Serviços Inclusos */}
              <div>
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">Serviços Inclusos</p>
                <div className="grid grid-cols-2 gap-2">
                  {SERVICOS_SIMPLES.map(s => {
                    const Icon = ICON_MAP[s.iconKey] || Circle
                    return (
                      <button key={s.id} onClick={() => toggleServicoSimples(s.id)}
                        className={`flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-medium transition-all border ${
                          servicosExtras.has(s.id)
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1 text-left">{s.nome}</span>
                        {servicosExtras.has(s.id) && <Check className="w-4 h-4 text-emerald-600" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* SEÇÃO: Acessórios (com marcas) */}
              <div>
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">Acessórios</p>
                <div className="grid grid-cols-1 gap-2">
                  {SERVICOS_COM_MARCA.map(cat => {
                    const Icon = ICON_MAP[cat.iconKey] || Circle
                    const selecionado = selecoesComMarca[cat.id]
                    return (
                      <div key={cat.id} className="relative">
                        <button
                          onClick={() => setMenuAberto(menuAberto === cat.id ? null : cat.id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-medium transition-all border ${
                            selecionado
                              ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                              : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <span className="flex-1 text-left">
                            {cat.nome}
                            {selecionado && (
                              <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                {selecionado.nome} · {formatCurrency(selecionado.preco)}
                              </span>
                            )}
                          </span>
                          {selecionado ? (
                            <button onClick={(e) => { e.stopPropagation(); removerMarca(cat.id) }}
                              className="p-1 rounded-full hover:bg-emerald-200 transition-colors">
                              <X className="w-3 h-3" />
                            </button>
                          ) : (
                            <ChevronDown className={`w-4 h-4 transition-transform ${menuAberto === cat.id ? 'rotate-180' : ''}`} />
                          )}
                        </button>

                        {/* Dropdown de marcas */}
                        {menuAberto === cat.id && !selecionado && (
                          <div className="mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-10 relative animate-fadeIn">
                            {cat.opcoes.map(opt => (
                              <button key={opt.id}
                                onClick={() => selecionarOpcaoMarca(cat.id, opt)}
                                className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-emerald-50 transition-colors border-b border-gray-50 last:border-0"
                              >
                                <span className="text-gray-700 font-medium">{opt.nome}</span>
                                <span className="text-emerald-600 font-semibold text-xs">{formatCurrency(opt.preco)}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* SEÇÃO: Entrega */}
              <div>
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">Entrega</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setEntrega('retirada')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      entrega === 'retirada'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Package className="w-4 h-4" /> Retirada na Loja
                  </button>
                  <button onClick={() => setEntrega('delivery')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      entrega === 'delivery'
                        ? 'border-orange-400 bg-orange-50 text-orange-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Truck className="w-4 h-4" /> Delivery
                  </button>
                </div>
                {entrega === 'delivery' && (
                  <div className="mt-2 space-y-2 bg-orange-50 rounded-xl p-3 border border-orange-200">
                    <input type="text" value={enderecoEntrega} onChange={e => setEnderecoEntrega(e.target.value)}
                      placeholder="Endereço de entrega..."
                      className="w-full px-3 py-2 rounded-lg border border-orange-200 text-sm outline-none focus:ring-2 focus:ring-orange-400 bg-white" />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-orange-600">Taxa:</span>
                      <input type="number" step="0.01" value={taxaDelivery} onChange={e => setTaxaDelivery(Number(e.target.value))}
                        className="w-24 px-3 py-1.5 rounded-lg border border-orange-200 text-sm outline-none bg-white" />
                    </div>
                  </div>
                )}
              </div>

              {/* SEÇÃO: Observações */}
              <div>
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">Observações</p>
                <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)}
                  placeholder="Informações adicionais (opcional)..."
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
              </div>
            </div>

            {/* Footer - Resumo + Salvar */}
            <div className="p-5 border-t border-gray-100 space-y-3">
              {/* Resumo de preço */}
              <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Encordoamento {cordaSel ? `(${cordaSel.nome})` : ''}</span>
                  <span>{formatCurrency(precoServico)}</span>
                </div>
                {SERVICOS_SIMPLES.filter(s => servicosExtras.has(s.id)).map(s => (
                  <div key={s.id} className="flex justify-between text-gray-500 text-xs">
                    <span>{s.nome}</span>
                    <span className="text-emerald-600">incluso</span>
                  </div>
                ))}
                {Object.entries(selecoesComMarca).map(([catId, opt]) => {
                  const cat = SERVICOS_COM_MARCA.find(c => c.id === catId)
                  return (
                    <div key={catId} className="flex justify-between text-gray-600">
                      <span>{cat?.nome}: <span className="text-gray-500">{opt.nome}</span></span>
                      <span>+{formatCurrency(opt.preco)}</span>
                    </div>
                  )
                })}
                {precoDelivery > 0 && (
                  <div className="flex justify-between text-orange-600">
                    <span>Delivery</span>
                    <span>+{formatCurrency(precoDelivery)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-gray-900 text-base pt-1.5 border-t border-gray-200">
                  <span>Total</span>
                  <span className="text-emerald-600">{formatCurrency(precoTotal)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={resetForm}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button onClick={salvar} disabled={!cordaSelecionada || salvando}
                  className="flex-[2] py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-emerald-200">
                  {salvando ? 'Salvando...' : 'Salvar e Registrar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Sucesso */}
      {sucesso && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 text-center animate-slideUp">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 font-heading">Serviço Registrado!</h2>
            <p className="text-sm text-gray-500 mt-1">
              {entrega === 'delivery' ? 'Delivery programado' : 'Aguardando retirada'}
            </p>
          </div>
        </div>
      )}

      {/* Modal Novo Cliente */}
      {showNovoCliente && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-slideUp">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 font-heading">Novo Cliente</h3>
              <button onClick={() => setShowNovoCliente(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">Dados do Cliente</p>
                <input placeholder="Nome completo *" value={novoCliente.nome} onChange={e => setNovoCliente(p => ({ ...p, nome: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500 mb-2" />
                <input placeholder="Telefone/WhatsApp *" value={novoCliente.telefone} onChange={e => setNovoCliente(p => ({ ...p, telefone: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">Localização</p>
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="Condomínio" value={novoCliente.condominio} onChange={e => setNovoCliente(p => ({ ...p, condominio: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
                  <input placeholder="Apartamento" value={novoCliente.apartamento} onChange={e => setNovoCliente(p => ({ ...p, apartamento: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button onClick={() => setShowNovoCliente(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">Cancelar</button>
              <button onClick={criarCliente} className="flex-[2] py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700">Salvar Cliente</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
