'use client'

import { useState, useEffect, useCallback } from 'react'
import { ShoppingBag, Plus, Minus, Trash2, Tag, Truck, Package, Star, Gift, X, ShoppingCart, ChevronDown, ChevronUp } from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/utils'

interface Produto {
  id: string
  nome: string
  categoria: string
  preco: number
  descricao: string
  estoque: number
  imagem: string
}

interface ItemCarrinho {
  id: string
  produtoId: string
  quantidade: number
  produto: Produto
}

interface Pedido {
  id: string
  status: string
  total: number
  entrega: string
  desconto: number
  taxaDelivery: number
  createdAt: string
  itens: { id: string; quantidade: number; precoUnit: number; produto: { nome: string } }[]
  pagamento: { status: string } | null
}

interface Encordoamento {
  id: string
  status: string
  createdAt: string
  corda: { id: string; nome: string; marca: string }
}

interface Fidelidade {
  pontosFidelidade: number
  totalEncordoamentos: number
  progressoParaGratis: number
  elegivel: boolean
  faltamPara10: number
}

const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  enviado: 'Enviado',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
}

const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-700',
  confirmado: 'bg-blue-100 text-blue-700',
  enviado: 'bg-purple-100 text-purple-700',
  entregue: 'bg-green-100 text-green-700',
  cancelado: 'bg-red-100 text-red-700',
}

export default function LojaClientePage() {
  const [telefone, setTelefone] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [clienteNome, setClienteNome] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [produtos, setProdutos] = useState<Produto[]>([])
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([])
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [fidelidade, setFidelidade] = useState<Fidelidade | null>(null)

  const [showCart, setShowCart] = useState(false)
  const [cupomInput, setCupomInput] = useState('')
  const [cupomDesconto, setCupomDesconto] = useState(0)
  const [cupomCodigo, setCupomCodigo] = useState('')
  const [cupomErro, setCupomErro] = useState('')
  const [entrega, setEntrega] = useState('retirada')
  const [endereco, setEndereco] = useState('')
  const [taxaDelivery] = useState(10)
  const [criandoPedido, setCriandoPedido] = useState(false)

  const [secao, setSecao] = useState<'loja' | 'pedidos' | 'fidelidade' | 'avaliacoes'>('loja')
  const [pedidoExpandido, setPedidoExpandido] = useState<string | null>(null)

  const [encordoamentos, setEncordoamentos] = useState<Encordoamento[]>([])
  const [avaliacoes, setAvaliacoes] = useState<Record<string, number>>({})
  const [enviandoAvaliacao, setEnviandoAvaliacao] = useState<string | null>(null)

  const carregarProdutos = async () => {
    const res = await fetch('/api/produtos')
    setProdutos(await res.json())
  }

  const carregarCarrinho = useCallback(async () => {
    if (!clienteId) return
    const res = await fetch(`/api/carrinho?clienteId=${clienteId}`)
    setCarrinho(await res.json())
  }, [clienteId])

  const carregarPedidos = useCallback(async () => {
    if (!clienteId) return
    const res = await fetch(`/api/pedidos?clienteId=${clienteId}`)
    setPedidos(await res.json())
  }, [clienteId])

  const carregarFidelidade = useCallback(async () => {
    if (!clienteId) return
    const res = await fetch(`/api/fidelidade/${clienteId}`)
    if (res.ok) setFidelidade(await res.json())
  }, [clienteId])

  const carregarEncordoamentos = useCallback(async () => {
    if (!clienteId) return
    const res = await fetch(`/api/encordoamentos?clienteId=${clienteId}`)
    const data = await res.json()
    const entregues = data.filter((e: Encordoamento) => e.status === 'entregue' || e.status === 'pronto')
    setEncordoamentos(entregues)
  }, [clienteId])

  const carregarAvaliacoes = useCallback(async () => {
    if (!clienteId) return
    const res = await fetch('/api/avaliacoes')
    const data = await res.json()
    const minhas: Record<string, number> = {}
    for (const a of data.avaliacoes) {
      if (a.cliente.id === clienteId) {
        minhas[a.corda.id] = a.nota
      }
    }
    setAvaliacoes(minhas)
  }, [clienteId])

  const enviarAvaliacao = async (cordaId: string, nota: number) => {
    setEnviandoAvaliacao(cordaId)
    try {
      await fetch('/api/avaliacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clienteId, cordaId, nota }),
      })
      setAvaliacoes(prev => ({ ...prev, [cordaId]: nota }))
    } catch {
      // silently fail
    } finally {
      setEnviandoAvaliacao(null)
    }
  }

  useEffect(() => {
    carregarProdutos()
  }, [])

  useEffect(() => {
    if (clienteId) {
      carregarCarrinho()
      carregarPedidos()
      carregarFidelidade()
      carregarEncordoamentos()
      carregarAvaliacoes()
    }
  }, [clienteId, carregarCarrinho, carregarPedidos, carregarFidelidade, carregarEncordoamentos, carregarAvaliacoes])

  const buscarCliente = async () => {
    if (!telefone.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/clientes?q=${encodeURIComponent(telefone)}`)
      const data = await res.json()
      if (data.length === 0) {
        setError('Nenhum cliente encontrado com esse telefone')
      } else {
        setClienteId(data[0].id)
        setClienteNome(data[0].nome)
      }
    } catch {
      setError('Erro ao buscar')
    } finally {
      setLoading(false)
    }
  }

  const addToCart = async (produtoId: string) => {
    await fetch('/api/carrinho', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clienteId, produtoId, quantidade: 1 }),
    })
    carregarCarrinho()
  }

  const atualizarQtd = async (itemId: string, quantidade: number) => {
    if (quantidade < 1) {
      await removerItem(itemId)
      return
    }
    await fetch(`/api/carrinho/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantidade }),
    })
    carregarCarrinho()
  }

  const removerItem = async (itemId: string) => {
    await fetch(`/api/carrinho/${itemId}`, { method: 'DELETE' })
    carregarCarrinho()
  }

  const subtotal = carrinho.reduce((sum, item) => sum + item.produto.preco * item.quantidade, 0)
  const deliveryFee = entrega === 'delivery' ? taxaDelivery : 0
  const totalFinal = subtotal - cupomDesconto + deliveryFee

  const validarCupom = async () => {
    setCupomErro('')
    setCupomDesconto(0)
    setCupomCodigo('')
    if (!cupomInput.trim()) return

    const res = await fetch('/api/cupons/validar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo: cupomInput, total: subtotal }),
    })
    const data = await res.json()
    if (res.ok) {
      setCupomDesconto(data.desconto)
      setCupomCodigo(data.cupom.codigo)
    } else {
      setCupomErro(data.error)
    }
  }

  const finalizarPedido = async () => {
    if (carrinho.length === 0) return
    setCriandoPedido(true)
    try {
      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId,
          entrega,
          enderecoEntrega: entrega === 'delivery' ? endereco : '',
          taxaDelivery: deliveryFee,
          cupomCodigo: cupomCodigo || undefined,
        }),
      })
      if (res.ok) {
        setCarrinho([])
        setCupomDesconto(0)
        setCupomCodigo('')
        setCupomInput('')
        setShowCart(false)
        setSecao('pedidos')
        carregarPedidos()
        carregarFidelidade()
      } else {
        const data = await res.json()
        setError(data.error || 'Erro ao criar pedido')
      }
    } catch {
      setError('Erro ao criar pedido')
    } finally {
      setCriandoPedido(false)
    }
  }

  const sair = () => {
    setClienteId('')
    setClienteNome('')
    setTelefone('')
    setCarrinho([])
    setPedidos([])
    setFidelidade(null)
    setEncordoamentos([])
    setAvaliacoes({})
    setCupomDesconto(0)
    setCupomCodigo('')
    setCupomInput('')
    setSecao('loja')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-600 text-white px-4 py-5 text-center">
        <h1 className="text-xl font-bold flex items-center justify-center gap-2">
          <ShoppingBag className="w-5 h-5" /> Bill Encordoamentos
        </h1>
        <p className="text-green-100 text-sm mt-1">Loja Online</p>
      </div>

      {/* Login */}
      {!clienteId ? (
        <div className="p-4 max-w-lg mx-auto">
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4 mt-4">
            <h2 className="text-lg font-semibold text-gray-800 text-center">Acesse a loja</h2>
            <p className="text-sm text-gray-500 text-center">Digite seu telefone para comecar</p>
            <input
              type="tel"
              placeholder="(00) 00000-0000"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && buscarCliente()}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-center text-lg outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={buscarCliente}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Buscando...' : 'Entrar'}
            </button>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          </div>

          {/* Show products preview */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">Nossos Produtos</h3>
            <div className="grid grid-cols-2 gap-3">
              {produtos.filter(p => p.estoque > 0).slice(0, 4).map((p) => (
                <div key={p.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                  <div className="w-full h-24 bg-green-50 rounded-lg flex items-center justify-center mb-2">
                    <Package className="w-8 h-8 text-green-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-800 truncate">{p.nome}</p>
                  <p className="text-xs text-gray-500 capitalize">{p.categoria}</p>
                  <p className="text-sm font-bold text-green-600 mt-1">{formatCurrency(p.preco)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-lg mx-auto">
          {/* User bar */}
          <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-100">
            <div>
              <span className="text-sm font-medium text-gray-800">Ola, {clienteNome.split(' ')[0]}!</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCart(true)}
                className="relative p-2"
              >
                <ShoppingCart className="w-5 h-5 text-green-600" />
                {carrinho.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                    {carrinho.reduce((s, i) => s + i.quantidade, 0)}
                  </span>
                )}
              </button>
              <button onClick={sair} className="text-xs text-green-600 underline">Sair</button>
            </div>
          </div>

          {/* Section tabs */}
          <div className="flex bg-white border-b border-gray-100">
            <button
              onClick={() => setSecao('loja')}
              className={`flex-1 py-3 text-xs font-medium text-center border-b-2 ${secao === 'loja' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500'}`}
            >
              <ShoppingBag className="w-4 h-4 mx-auto mb-0.5" /> Loja
            </button>
            <button
              onClick={() => setSecao('pedidos')}
              className={`flex-1 py-3 text-xs font-medium text-center border-b-2 ${secao === 'pedidos' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500'}`}
            >
              <Package className="w-4 h-4 mx-auto mb-0.5" /> Pedidos
            </button>
            <button
              onClick={() => setSecao('fidelidade')}
              className={`flex-1 py-3 text-xs font-medium text-center border-b-2 ${secao === 'fidelidade' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500'}`}
            >
              <Star className="w-4 h-4 mx-auto mb-0.5" /> Fidelidade
            </button>
            <button
              onClick={() => setSecao('avaliacoes')}
              className={`flex-1 py-3 text-xs font-medium text-center border-b-2 ${secao === 'avaliacoes' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500'}`}
            >
              <Star className="w-4 h-4 mx-auto mb-0.5" /> Avaliar
            </button>
          </div>

          <div className="p-4 space-y-4 pb-8">
            {/* LOJA SECTION */}
            {secao === 'loja' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {produtos.map((p) => (
                    <div key={p.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                      <div className="w-full h-28 bg-green-50 rounded-lg flex items-center justify-center mb-2">
                        <Package className="w-10 h-10 text-green-300" />
                      </div>
                      <p className="text-sm font-medium text-gray-800 truncate">{p.nome}</p>
                      <p className="text-xs text-gray-500 capitalize">{p.categoria}</p>
                      {p.descricao && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{p.descricao}</p>}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-bold text-green-600">{formatCurrency(p.preco)}</span>
                        {p.estoque > 0 ? (
                          <button
                            onClick={() => addToCart(p.id)}
                            className="p-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-xs text-red-500">Esgotado</span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">{p.estoque > 0 ? `${p.estoque} em estoque` : ''}</p>
                    </div>
                  ))}
                </div>
                {produtos.length === 0 && (
                  <p className="text-center text-gray-400 py-8 text-sm">Nenhum produto disponivel</p>
                )}
              </>
            )}

            {/* PEDIDOS SECTION */}
            {secao === 'pedidos' && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Package className="w-4 h-4" /> Meus Pedidos
                </h3>
                {pedidos.length === 0 && (
                  <p className="text-center text-gray-400 py-8 text-sm">Nenhum pedido ainda</p>
                )}
                {pedidos.map((p) => (
                  <div key={p.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() => setPedidoExpandido(pedidoExpandido === p.id ? null : p.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[p.status]}`}>
                              {statusLabels[p.status]}
                            </span>
                            {p.entrega === 'delivery' && (
                              <Truck className="w-3 h-3 text-blue-500" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{formatDateTime(p.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-green-600 text-sm">{formatCurrency(p.total)}</span>
                          {pedidoExpandido === p.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </div>
                      </div>
                    </div>
                    {pedidoExpandido === p.id && (
                      <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-1">
                        {p.itens.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-gray-700">{item.quantidade}x {item.produto.nome}</span>
                            <span className="text-gray-600">{formatCurrency(item.precoUnit * item.quantidade)}</span>
                          </div>
                        ))}
                        {p.desconto > 0 && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span>Desconto</span>
                            <span>-{formatCurrency(p.desconto)}</span>
                          </div>
                        )}
                        {p.taxaDelivery > 0 && (
                          <div className="flex justify-between text-sm text-gray-500">
                            <span>Delivery</span>
                            <span>{formatCurrency(p.taxaDelivery)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* FIDELIDADE SECTION */}
            {secao === 'fidelidade' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Star className="w-4 h-4" /> Programa Fidelidade
                </h3>

                {fidelidade ? (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                        <span className="text-3xl font-bold text-gray-800">{fidelidade.pontosFidelidade}</span>
                      </div>
                      <p className="text-sm text-gray-500">pontos acumulados</p>
                    </div>

                    <div className="bg-green-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-700">Progresso para encordoamento gratis</span>
                        <span className="text-sm font-bold text-green-600">{fidelidade.progressoParaGratis}/10</span>
                      </div>
                      <div className="w-full h-3 bg-green-200 rounded-full">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all"
                          style={{ width: `${(fidelidade.progressoParaGratis / 10) * 100}%` }}
                        />
                      </div>
                      {fidelidade.elegivel ? (
                        <div className="flex items-center gap-2 mt-3 text-yellow-700">
                          <Gift className="w-5 h-5" />
                          <span className="text-sm font-bold">Seu proximo encordoamento e gratis!</span>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 mt-2">
                          Faltam {fidelidade.faltamPara10} encordoamentos para ganhar um gratis!
                        </p>
                      )}
                    </div>

                    <div className="text-center">
                      <p className="text-xs text-gray-400">Total de encordoamentos: {fidelidade.totalEncordoamentos}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-gray-400 py-8 text-sm">Carregando...</p>
                )}
              </div>
            )}

            {/* AVALIACOES SECTION */}
            {secao === 'avaliacoes' && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Star className="w-4 h-4" /> Avalie suas cordas
                </h3>
                <p className="text-xs text-gray-500">Avalie as cordas dos seus encordoamentos finalizados</p>

                {encordoamentos.length === 0 ? (
                  <p className="text-center text-gray-400 py-8 text-sm">Nenhum encordoamento finalizado para avaliar</p>
                ) : (
                  encordoamentos.map((enc) => {
                    const notaAtual = avaliacoes[enc.corda.id] || 0
                    return (
                      <div key={enc.id} className="bg-white rounded-xl p-4 border border-gray-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{enc.corda.nome}</p>
                            <p className="text-xs text-gray-500">{enc.corda.marca}</p>
                          </div>
                          {notaAtual > 0 && (
                            <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">Avaliado</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((estrela) => (
                            <button
                              key={estrela}
                              disabled={enviandoAvaliacao === enc.corda.id}
                              onClick={() => enviarAvaliacao(enc.corda.id, estrela)}
                              className="p-0.5 transition-transform hover:scale-110 disabled:opacity-50"
                            >
                              <Star
                                className={`w-7 h-7 ${
                                  estrela <= notaAtual
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            </button>
                          ))}
                          {notaAtual > 0 && (
                            <span className="text-sm text-gray-500 ml-2">{notaAtual}/5</span>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>

          {/* Cart Modal */}
          {showCart && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center">
              <div className="bg-white w-full max-w-lg rounded-t-2xl md:rounded-2xl max-h-[85vh] overflow-y-auto">
                <div className="sticky top-0 bg-white p-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-green-600" /> Carrinho
                  </h3>
                  <button onClick={() => setShowCart(false)} className="p-1">
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <div className="p-4 space-y-4">
                  {carrinho.length === 0 ? (
                    <p className="text-center text-gray-400 py-8 text-sm">Carrinho vazio</p>
                  ) : (
                    <>
                      {/* Items */}
                      <div className="space-y-3">
                        {carrinho.map((item) => (
                          <div key={item.id} className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Package className="w-5 h-5 text-green-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{item.produto.nome}</p>
                              <p className="text-xs text-gray-500">{formatCurrency(item.produto.preco)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => atualizarQtd(item.id, item.quantidade - 1)}
                                className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-sm font-medium w-5 text-center">{item.quantidade}</span>
                              <button
                                onClick={() => atualizarQtd(item.id, item.quantidade + 1)}
                                className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <button onClick={() => removerItem(item.id)} className="text-red-400 hover:text-red-600 p-1">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Cupom */}
                      <div className="border-t border-gray-100 pt-3">
                        <label className="text-xs text-gray-500 mb-1 block">Cupom de desconto</label>
                        <div className="flex gap-2">
                          <input
                            placeholder="Codigo do cupom"
                            value={cupomInput}
                            onChange={(e) => setCupomInput(e.target.value)}
                            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-green-500 uppercase"
                          />
                          <button
                            onClick={validarCupom}
                            className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200"
                          >
                            <Tag className="w-4 h-4" />
                          </button>
                        </div>
                        {cupomErro && <p className="text-xs text-red-500 mt-1">{cupomErro}</p>}
                        {cupomCodigo && (
                          <p className="text-xs text-green-600 mt-1">Cupom {cupomCodigo} aplicado: -{formatCurrency(cupomDesconto)}</p>
                        )}
                      </div>

                      {/* Delivery toggle */}
                      <div className="border-t border-gray-100 pt-3">
                        <label className="text-xs text-gray-500 mb-2 block">Entrega</label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEntrega('retirada')}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium ${entrega === 'retirada' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                          >
                            <Package className="w-4 h-4" /> Retirada
                          </button>
                          <button
                            onClick={() => setEntrega('delivery')}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium ${entrega === 'delivery' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                          >
                            <Truck className="w-4 h-4" /> Delivery
                          </button>
                        </div>
                        {entrega === 'delivery' && (
                          <input
                            placeholder="Endereco de entrega"
                            value={endereco}
                            onChange={(e) => setEndereco(e.target.value)}
                            className="w-full mt-2 px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-green-500"
                          />
                        )}
                      </div>

                      {/* Totals */}
                      <div className="border-t border-gray-100 pt-3 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal</span>
                          <span className="text-gray-800">{formatCurrency(subtotal)}</span>
                        </div>
                        {cupomDesconto > 0 && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span>Desconto</span>
                            <span>-{formatCurrency(cupomDesconto)}</span>
                          </div>
                        )}
                        {entrega === 'delivery' && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Taxa delivery</span>
                            <span className="text-gray-800">{formatCurrency(deliveryFee)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-base font-bold pt-1">
                          <span className="text-gray-800">Total</span>
                          <span className="text-green-600">{formatCurrency(totalFinal)}</span>
                        </div>
                      </div>

                      {/* Checkout */}
                      <button
                        onClick={finalizarPedido}
                        disabled={criandoPedido || carrinho.length === 0 || (entrega === 'delivery' && !endereco)}
                        className="w-full py-3 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50 text-sm"
                      >
                        {criandoPedido ? 'Finalizando...' : 'Finalizar Pedido'}
                      </button>

                      {error && <p className="text-xs text-red-500 text-center">{error}</p>}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
