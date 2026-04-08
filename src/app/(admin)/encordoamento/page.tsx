'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import { Search, RotateCcw, Check, Plus, Truck, Package, X } from 'lucide-react'
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
  estoque: number
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

// Serviços inclusos (sem custo)
const SERVICOS_INCLUSOS = [
  { id: 'pintar_logo', nome: 'Pintar Logo' },
  { id: 'limpeza', nome: 'Limpeza Raquete' },
]

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
  const [produtos, setProdutos] = useState<{ id: string; nome: string; categoria: string; preco: number }[]>([])
  const [produtosSelecionados, setProdutosSelecionados] = useState<Record<string, { preco: number; qtd: number }>>({})
  const [busca, setBusca] = useState('')
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [tipoEnc, setTipoEnc] = useState<'padrao' | 'hibrida'>('padrao')
  const [cordaSelecionada, setCordaSelecionada] = useState<string>('') // main
  const [cordaCross, setCordaCross] = useState<string>('') // cruzadas (híbrida)
  const [tensao, setTensao] = useState<number>(55) // main
  const [tensaoCross, setTensaoCross] = useState<number>(53) // cruzadas
  const [preco, setPreco] = useState<number>(0)
  const [desconto, setDesconto] = useState<number>(0)
  const [valorExtra, setValorExtra] = useState<number>(0) // caixinha / valor avulso
  const [observacoes, setObservacoes] = useState('')
  const [entrega, setEntrega] = useState<'retirada' | 'delivery'>('retirada')
  const [enderecoEntrega, setEnderecoEntrega] = useState('')
  const [taxaDelivery, setTaxaDelivery] = useState<number>(10)
  const [cordasExtras, setCordasExtras] = useState<Record<string, { preco: number; qtd: number }>>({})
  const [buscaCorda, setBuscaCorda] = useState('')
  const [servicosInclusos, setServicosInclusos] = useState<Set<string>>(new Set())
  const [buscaProduto, setBuscaProduto] = useState('')
  const [catProduto, setCatProduto] = useState<string>('todos')
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

  // Carregar últimos clientes, cordas e produtos ao abrir
  useEffect(() => {
    fetch('/api/cordas').then(r => r.json()).then(setCordas)
    fetch('/api/produtos').then(r => r.json()).then(setProdutos)
    buscarClientes('')
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

  const toggleIncluso = (id: string) => {
    setServicosInclusos(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const addCordaExtra = (cordaId: string, preco: number) => {
    setCordasExtras(prev => {
      const existing = prev[cordaId]
      return { ...prev, [cordaId]: { preco, qtd: existing ? existing.qtd + 1 : 1 } }
    })
  }

  const removeCordaExtra = (cordaId: string) => {
    setCordasExtras(prev => {
      const existing = prev[cordaId]
      if (!existing || existing.qtd <= 1) {
        const next = { ...prev }
        delete next[cordaId]
        return next
      }
      return { ...prev, [cordaId]: { ...existing, qtd: existing.qtd - 1 } }
    })
  }

  const addProduto = (produtoId: string, preco: number) => {
    setProdutosSelecionados(prev => {
      const existing = prev[produtoId]
      return { ...prev, [produtoId]: { preco, qtd: existing ? existing.qtd + 1 : 1 } }
    })
  }

  const removeProduto = (produtoId: string) => {
    setProdutosSelecionados(prev => {
      const existing = prev[produtoId]
      if (!existing || existing.qtd <= 1) {
        const next = { ...prev }
        delete next[produtoId]
        return next
      }
      return { ...prev, [produtoId]: { ...existing, qtd: existing.qtd - 1 } }
    })
  }

  // Cordas extras: a corda principal já conta 1 unidade no precoServico, então só soma as extras adicionais
  const totalCordasExtras = Object.entries(cordasExtras).reduce((sum, [id, c]) => {
    if (id === cordaSelecionada) return sum + c.preco * c.qtd // extras avulsas da mesma corda (base já no precoServico)
    return sum + c.preco * c.qtd
  }, 0)
  const totalProdutos = Object.values(produtosSelecionados).reduce((sum, p) => sum + p.preco * p.qtd, 0)
  const totalExtras = totalProdutos + totalCordasExtras
  const precoServico = preco
  const precoDelivery = entrega === 'delivery' ? taxaDelivery : 0
  const subtotal = precoServico + totalExtras + precoDelivery + valorExtra
  const precoTotal = Math.max(0, subtotal - desconto)

  const repetirUltimo = () => {
    if (!lastEnc) return
    setCordaSelecionada(lastEnc.cordaId)
    setTensao(lastEnc.tensao)
    setPreco(lastEnc.preco)
    if (lastEnc.tipo === 'hibrida') {
      setTipoEnc('hibrida')
      if (lastEnc.tensaoCross) setTensaoCross(lastEnc.tensaoCross)
    } else {
      setTipoEnc('padrao')
    }
    toast({ title: `Repetindo: ${lastEnc.corda.nome} ${lastEnc.tensao}lbs`, type: 'success' })
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
    setDesconto(0)
    setValorExtra(0)
    setObservacoes('')
    setEntrega('retirada')
    setEnderecoEntrega('')
    setCordasExtras({})
    setBuscaCorda('')
    setServicosInclusos(new Set())
    setProdutosSelecionados({})
    setBuscaProduto('')
    setCatProduto('todos')
    setBusca('')
    setLastEnc(null)
  }

  const salvar = async () => {
    const temAlgo = cordaSelecionada || Object.keys(cordasExtras).length > 0 || Object.keys(produtosSelecionados).length > 0 || valorExtra > 0
    if (!clienteSelecionado || !temAlgo) return
    setSalvando(true)
    const cordasExtrasNomes = Object.entries(cordasExtras).map(([id, { qtd }]) => {
      const c = cordas.find(co => co.id === id)
      return c ? `${c.nome}${qtd > 1 ? ` x${qtd}` : ''}` : ''
    }).filter(Boolean)
    const inclusos = SERVICOS_INCLUSOS.filter(s => servicosInclusos.has(s.id)).map(s => s.nome)
    const produtosNomes = Object.entries(produtosSelecionados).map(([id, { qtd }]) => {
      const p = produtos.find(pr => pr.id === id)
      return p ? `${p.nome}${qtd > 1 ? ` x${qtd}` : ''}` : ''
    }).filter(Boolean)
    const extras = [...cordasExtrasNomes, ...inclusos, ...produtosNomes].join(', ')
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
          <h1 className="text-2xl font-bold text-gray-900 font-heading">Nova Venda</h1>
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
                <h2 className="text-lg font-bold text-gray-900 font-heading">Nova Venda</h2>
                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                  {clienteSelecionado.nome} · {clienteSelecionado.telefone || 'Sem tel'}
                  {(clienteSelecionado as any).centroReceita && (
                    <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase">
                      {(clienteSelecionado as any).centroReceita}
                    </span>
                  )}
                </p>
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

              {/* SEÇÃO: Cordas — Layout POS (badges grid) */}
              <div>
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">
                  {tipoEnc === 'hibrida' ? 'Corda Principal (Mains)' : 'Cordas'}
                  {Object.keys(cordasExtras).length > 0 && (
                    <span className="text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full ml-1">
                      {Object.values(cordasExtras).reduce((s, c) => s + c.qtd, 0)} un
                    </span>
                  )}
                </p>
                <input type="text" value={buscaCorda} onChange={e => setBuscaCorda(e.target.value)}
                  placeholder="Buscar corda..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500 mb-2" />
                {/* Abas por marca */}
                {(() => {
                  const cordasFiltradas = cordas.filter(c => !buscaCorda || c.nome.toLowerCase().includes(buscaCorda.toLowerCase()) || c.marca.toLowerCase().includes(buscaCorda.toLowerCase()))
                  const marcas = ['Todas', ...([...new Set(cordasFiltradas.map(c => c.marca))].sort())]
                  return (
                    <>
                      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-hide">
                        {marcas.map(m => (
                          <button key={m} onClick={() => setBuscaCorda(m === 'Todas' ? '' : m)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                              (m === 'Todas' && !buscaCorda) || buscaCorda === m
                                ? 'bg-emerald-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}>
                            {m}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                        {cordasFiltradas.map(c => {
                          const sel = cordasExtras[c.id]
                          const isMain = cordaSelecionada === c.id
                          return (
                            <div key={c.id}
                              className={`relative rounded-xl p-2.5 text-center transition-all border-2 cursor-pointer ${
                                isMain ? 'bg-emerald-100 border-emerald-500 shadow-sm shadow-emerald-200' :
                                sel ? 'bg-emerald-50 border-emerald-400' :
                                'bg-white border-gray-200 hover:border-emerald-300 hover:shadow-sm'
                              }`}>
                              {/* Badge de quantidade */}
                              {sel && (
                                <span className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-600 text-white rounded-full text-xs font-bold flex items-center justify-center shadow">
                                  {sel.qtd}
                                </span>
                              )}
                              {/* Estoque baixo */}
                              {c.estoque <= 0 && (
                                <span className="absolute top-1 left-1 text-[9px] bg-red-600 text-white px-1 py-0.5 rounded font-bold">SEM EST.</span>
                              )}
                              {c.estoque > 0 && c.estoque <= 3 && (
                                <span className="absolute top-1 left-1 text-[9px] bg-amber-500 text-white px-1 py-0.5 rounded font-bold">{c.estoque} un</span>
                              )}
                              {/* Toque para encordoar */}
                              <button className="w-full" onClick={() => { setCordaSelecionada(c.id); setPreco(c.preco) }}>
                                <p className="text-xs font-bold text-gray-800 leading-tight truncate">{c.nome}</p>
                                <p className="text-[10px] text-gray-400 truncate">{c.marca} · {c.tipo}</p>
                                <p className="text-sm font-bold text-emerald-600 mt-1">{formatCurrency(c.preco)}</p>
                                {isMain && <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-semibold">encordoar</span>}
                              </button>
                              {/* Botão avulsa */}
                              <div className="mt-1.5 flex justify-center">
                                {sel ? (
                                  <div className="flex items-center gap-0.5 bg-gray-50 rounded-lg border border-gray-200">
                                    <button onClick={() => removeCordaExtra(c.id)}
                                      className="w-7 h-7 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-l-lg font-bold text-sm">-</button>
                                    <span className="w-5 text-center text-xs font-bold">{sel.qtd}</span>
                                    <button onClick={() => addCordaExtra(c.id, c.preco)}
                                      className="w-7 h-7 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 rounded-r-lg font-bold text-sm">+</button>
                                  </div>
                                ) : (
                                  <button onClick={() => addCordaExtra(c.id, c.preco)}
                                    className="text-[10px] px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-semibold hover:bg-emerald-100 transition-colors">
                                    + avulsa
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )
                })()}
                {/* Alerta de estoque baixo para corda selecionada */}
                {cordaSel && cordaSel.estoque <= 3 && (
                  <div className={`mt-2 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 ${
                    cordaSel.estoque <= 0
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    <span>{cordaSel.estoque <= 0 ? '⚠' : '📦'}</span>
                    {cordaSel.estoque <= 0
                      ? `${cordaSel.nome} está sem estoque!`
                      : `${cordaSel.nome} — apenas ${cordaSel.estoque} unidade${cordaSel.estoque > 1 ? 's' : ''} em estoque`
                    }
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

              {/* SEÇÃO: Inclusos */}
              <div>
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">Inclusos (sem custo)</p>
                <div className="grid grid-cols-2 gap-2">
                  {SERVICOS_INCLUSOS.map(s => (
                    <button key={s.id} onClick={() => toggleIncluso(s.id)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                        servicosInclusos.has(s.id)
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <span className="flex-1 text-left">{s.nome}</span>
                      {servicosInclusos.has(s.id) && <Check className="w-4 h-4 text-emerald-600" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* SEÇÃO: Produtos — Layout POS (badges grid com abas de categoria) */}
              {produtos.length > 0 && (() => {
                const catLabels: Record<string, string> = {
                  servico: 'Mão de Obra', grip: 'Grips', overgrip: 'Overgrips',
                  acessorio: 'Acessórios', raquete: 'Raquetes',
                }
                const categorias = [...new Set(produtos.map(p => p.categoria))].sort()
                const filtrados = buscaProduto
                  ? produtos.filter(p => p.nome.toLowerCase().includes(buscaProduto.toLowerCase()))
                  : catProduto === 'todos'
                    ? produtos
                    : produtos.filter(p => p.categoria === catProduto)
                return (
                  <div>
                    <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">
                      Produtos {Object.keys(produtosSelecionados).length > 0 && (
                        <span className="text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full ml-1">
                          {Object.values(produtosSelecionados).reduce((s, p) => s + p.qtd, 0)} itens
                        </span>
                      )}
                    </p>
                    <input
                      type="text" value={buscaProduto} onChange={e => setBuscaProduto(e.target.value)}
                      placeholder="Buscar produto..."
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500 mb-2"
                    />
                    {/* Abas de categoria */}
                    <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-hide">
                      <button onClick={() => setCatProduto('todos')}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                          catProduto === 'todos' && !buscaProduto ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}>
                        Todos
                      </button>
                      {categorias.map(cat => (
                        <button key={cat} onClick={() => { setCatProduto(cat); setBuscaProduto('') }}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                            catProduto === cat && !buscaProduto ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}>
                          {catLabels[cat] || cat}
                        </button>
                      ))}
                    </div>
                    {/* Grid de badges */}
                    <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                      {filtrados.map(p => {
                        const sel = produtosSelecionados[p.id]
                        return (
                          <div key={p.id}
                            className={`relative rounded-xl p-2.5 text-center transition-all border-2 ${
                              sel ? 'bg-emerald-50 border-emerald-400 shadow-sm' : 'bg-white border-gray-200 hover:border-emerald-300 hover:shadow-sm'
                            }`}>
                            {/* Badge de quantidade */}
                            {sel && (
                              <span className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-600 text-white rounded-full text-xs font-bold flex items-center justify-center shadow">
                                {sel.qtd}
                              </span>
                            )}
                            <p className="text-xs font-bold text-gray-800 leading-tight truncate">{p.nome}</p>
                            <p className="text-[10px] text-gray-400">{catLabels[p.categoria] || p.categoria}</p>
                            <p className="text-sm font-bold text-emerald-600 mt-1">{formatCurrency(p.preco)}</p>
                            {/* Controles */}
                            <div className="mt-1.5 flex justify-center">
                              {sel ? (
                                <div className="flex items-center gap-0.5 bg-gray-50 rounded-lg border border-gray-200">
                                  <button onClick={() => removeProduto(p.id)}
                                    className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-l-lg font-bold text-base">-</button>
                                  <span className="w-6 text-center text-xs font-bold">{sel.qtd}</span>
                                  <button onClick={() => addProduto(p.id, p.preco)}
                                    className="w-8 h-8 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 rounded-r-lg font-bold text-base">+</button>
                                </div>
                              ) : (
                                <button onClick={() => addProduto(p.id, p.preco)}
                                  className="w-8 h-8 flex items-center justify-center bg-emerald-600 text-white rounded-xl text-base font-bold hover:bg-emerald-700 transition-colors shadow-sm">+</button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}

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

              {/* SEÇÃO: Valor Extra + Desconto */}
              <div>
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">Ajustes de Valor</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Valor extra (avulso)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-gray-400">R$</span>
                      <input type="number" step="0.01" value={valorExtra || ''} onChange={e => setValorExtra(Number(e.target.value) || 0)}
                        placeholder="0,00"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-red-500 mb-1 block">Desconto</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-red-400">-R$</span>
                      <input type="number" step="0.01" value={desconto || ''} onChange={e => setDesconto(Number(e.target.value) || 0)}
                        placeholder="0,00"
                        className="w-full pl-11 pr-3 py-2.5 rounded-xl border border-red-200 text-sm outline-none focus:ring-2 focus:ring-red-400 text-red-600" />
                    </div>
                  </div>
                </div>
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
                {/* Cordas: unifica encordoamento + extras */}
                {(() => {
                  const linhas: { nome: string; qtd: number; preco: number; encordoar: boolean }[] = []
                  // Corda principal (encordoar)
                  if (cordaSel) {
                    const extraQtd = cordasExtras[cordaSelecionada]?.qtd || 0
                    linhas.push({ nome: cordaSel.nome, qtd: 1 + extraQtd, preco: cordaSel.preco, encordoar: true })
                  }
                  // Cordas extras (não duplicar a principal)
                  Object.entries(cordasExtras).forEach(([id, { preco: p, qtd }]) => {
                    if (id === cordaSelecionada) return // já incluída acima
                    const c = cordas.find(co => co.id === id)
                    if (c) linhas.push({ nome: c.nome, qtd, preco: p, encordoar: false })
                  })
                  return linhas.map((l, i) => (
                    <div key={i} className="flex justify-between text-gray-600">
                      <span className="truncate mr-2">
                        {l.nome} {l.qtd > 1 && <span className="text-xs text-gray-400">x{l.qtd}</span>}
                        {l.encordoar && <span className="text-xs text-emerald-500 ml-1">(encordoar)</span>}
                      </span>
                      <span className="flex-shrink-0">{formatCurrency(l.preco * l.qtd)}</span>
                    </div>
                  ))
                })()}
                {SERVICOS_INCLUSOS.filter(s => servicosInclusos.has(s.id)).map(s => (
                  <div key={s.id} className="flex justify-between text-gray-500 text-xs">
                    <span>{s.nome}</span>
                    <span className="text-emerald-600">incluso</span>
                  </div>
                ))}
                {Object.entries(produtosSelecionados).map(([id, { preco, qtd }]) => {
                  const p = produtos.find(pr => pr.id === id)
                  return (
                    <div key={id} className="flex justify-between text-gray-600">
                      <span className="truncate mr-2">{p?.nome} {qtd > 1 && <span className="text-xs text-gray-400">x{qtd}</span>}</span>
                      <span className="flex-shrink-0">+{formatCurrency(preco * qtd)}</span>
                    </div>
                  )
                })}
                {precoDelivery > 0 && (
                  <div className="flex justify-between text-orange-600">
                    <span>Delivery</span>
                    <span>+{formatCurrency(precoDelivery)}</span>
                  </div>
                )}
                {valorExtra > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Valor extra</span>
                    <span>+{formatCurrency(valorExtra)}</span>
                  </div>
                )}
                {desconto > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Desconto</span>
                    <span>-{formatCurrency(desconto)}</span>
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
                <button onClick={salvar} disabled={(!cordaSelecionada && Object.keys(cordasExtras).length === 0 && Object.keys(produtosSelecionados).length === 0 && valorExtra <= 0) || salvando}
                  className="flex-[2] py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-emerald-200">
                  {salvando ? 'Salvando...' : 'Salvar e Registrar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Sucesso - com resumo e ações */}
      {sucesso && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-slideUp">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 font-heading">Venda Registrada!</h2>
              <p className="text-sm text-gray-500 mt-1">
                {entrega === 'delivery' ? 'Delivery programado' : 'Aguardando retirada'}
              </p>

              {/* Resumo da venda */}
              <div className="bg-gray-50 rounded-xl p-4 mt-4 text-left space-y-2 text-sm">
                {clienteSelecionado && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Cliente</span>
                    <span className="font-medium text-gray-800">{clienteSelecionado.nome}</span>
                  </div>
                )}
                {cordaSel && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Corda</span>
                    <span className="font-medium text-gray-800">{cordaSel.nome} {tensao}lbs</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-500 font-semibold">Total</span>
                  <span className="font-bold text-emerald-600 text-base">{formatCurrency(precoTotal)}</span>
                </div>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button
                onClick={() => { setSucesso(false); resetForm() }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Nova Venda
              </button>
              <a
                href="/vendas"
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 font-medium hover:bg-gray-50 transition-colors text-center"
              >
                Ver Vendas
              </a>
            </div>
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
