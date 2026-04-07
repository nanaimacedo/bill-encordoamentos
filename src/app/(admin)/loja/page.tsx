'use client'

import { useEffect, useState } from 'react'
import { ShoppingBag, Tag, Gift, Star, Plus, ChevronDown, ChevronUp, Check, Truck, Package, X } from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/utils'

type Tab = 'pedidos' | 'cupons' | 'fidelidade'

interface Pedido {
  id: string
  clienteId: string
  status: string
  total: number
  entrega: string
  enderecoEntrega: string
  taxaDelivery: number
  desconto: number
  createdAt: string
  cliente: { id: string; nome: string; telefone: string }
  itens: { id: string; quantidade: number; precoUnit: number; produto: { nome: string; categoria: string } }[]
  pagamento: { id: string; status: string; valor: number } | null
  cupom: { codigo: string } | null
}

interface Cupom {
  id: string
  codigo: string
  descricao: string
  tipo: string
  valor: number
  minimo: number
  usos: number
  maxUsos: number
  ativo: boolean
  validade: string | null
  createdAt: string
}

interface ClienteFidelidade {
  id: string
  nome: string
  telefone: string
  pontosFidelidade: number
  _count?: { encordoamentos: number }
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

export default function LojaAdminPage() {
  const [tab, setTab] = useState<Tab>('pedidos')
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [cupons, setCupons] = useState<Cupom[]>([])
  const [clientes, setClientes] = useState<ClienteFidelidade[]>([])
  const [loading, setLoading] = useState(true)
  const [expandido, setExpandido] = useState<string | null>(null)
  const [showFormCupom, setShowFormCupom] = useState(false)
  const [formCupom, setFormCupom] = useState({
    codigo: '', descricao: '', tipo: 'percentual', valor: 0, minimo: 0, maxUsos: 100, validade: ''
  })

  const carregarPedidos = async () => {
    const res = await fetch('/api/pedidos')
    setPedidos(await res.json())
  }

  const carregarCupons = async () => {
    const res = await fetch('/api/cupons')
    setCupons(await res.json())
  }

  const carregarClientes = async () => {
    const res = await fetch('/api/clientes')
    setClientes(await res.json())
  }

  useEffect(() => {
    Promise.all([carregarPedidos(), carregarCupons(), carregarClientes()]).finally(() => setLoading(false))
  }, [])

  const atualizarStatus = async (pedidoId: string, status: string) => {
    await fetch(`/api/pedidos/${pedidoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    carregarPedidos()
  }

  const criarCupom = async () => {
    await fetch('/api/cupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formCupom,
        validade: formCupom.validade || null,
      }),
    })
    setShowFormCupom(false)
    setFormCupom({ codigo: '', descricao: '', tipo: 'percentual', valor: 0, minimo: 0, maxUsos: 100, validade: '' })
    carregarCupons()
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <ShoppingBag className="w-6 h-6 text-green-600" />
        <h1 className="text-2xl font-bold text-gray-800">Loja & Marketplace</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setTab('pedidos')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium ${tab === 'pedidos' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}
        >
          <ShoppingBag className="w-4 h-4" /> Pedidos ({pedidos.length})
        </button>
        <button
          onClick={() => setTab('cupons')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium ${tab === 'cupons' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}
        >
          <Tag className="w-4 h-4" /> Cupons ({cupons.length})
        </button>
        <button
          onClick={() => setTab('fidelidade')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium ${tab === 'fidelidade' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}
        >
          <Star className="w-4 h-4" /> Fidelidade
        </button>
      </div>

      {/* PEDIDOS TAB */}
      {tab === 'pedidos' && (
        <div className="space-y-2">
          {pedidos.length === 0 && (
            <p className="text-center text-gray-400 py-8 text-sm">Nenhum pedido registrado</p>
          )}
          {pedidos.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div
                className="p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandido(expandido === p.id ? null : p.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-gray-800">{p.cliente.nome}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[p.status]}`}>
                        {statusLabels[p.status]}
                      </span>
                      {p.entrega === 'delivery' && (
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          <Truck className="w-3 h-3" /> Delivery
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                      <span>{formatDateTime(p.createdAt)}</span>
                      <span>{p.itens.length} {p.itens.length === 1 ? 'item' : 'itens'}</span>
                      {p.cupom && <span className="text-green-600">Cupom: {p.cupom.codigo}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-green-600">{formatCurrency(p.total)}</span>
                    {expandido === p.id ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {expandido === p.id && (
                <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-3">
                  {/* Items */}
                  <div className="space-y-1">
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
                        <span>Taxa delivery</span>
                        <span>{formatCurrency(p.taxaDelivery)}</span>
                      </div>
                    )}
                    {p.enderecoEntrega && (
                      <p className="text-xs text-gray-500 mt-1">Endereco: {p.enderecoEntrega}</p>
                    )}
                  </div>

                  {/* Status Actions */}
                  <div className="flex gap-2 flex-wrap pt-2">
                    {p.status === 'pendente' && (
                      <>
                        <button
                          onClick={() => atualizarStatus(p.id, 'confirmado')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700"
                        >
                          <Check className="w-3 h-3" /> Confirmar
                        </button>
                        <button
                          onClick={() => atualizarStatus(p.id, 'cancelado')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700"
                        >
                          <X className="w-3 h-3" /> Cancelar
                        </button>
                      </>
                    )}
                    {p.status === 'confirmado' && (
                      <button
                        onClick={() => atualizarStatus(p.id, 'enviado')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700"
                      >
                        <Truck className="w-3 h-3" /> Enviar
                      </button>
                    )}
                    {p.status === 'enviado' && (
                      <button
                        onClick={() => atualizarStatus(p.id, 'entregue')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700"
                      >
                        <Package className="w-3 h-3" /> Marcar Entregue
                      </button>
                    )}
                    {p.pagamento && (
                      <span className={`text-xs px-2 py-1.5 rounded-lg font-medium ${p.pagamento.status === 'pago' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        Pgto: {p.pagamento.status}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* CUPONS TAB */}
      {tab === 'cupons' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={() => setShowFormCupom(true)}
              className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
            >
              <Plus className="w-4 h-4" /> Novo Cupom
            </button>
          </div>

          {cupons.length === 0 && (
            <p className="text-center text-gray-400 py-8 text-sm">Nenhum cupom cadastrado</p>
          )}

          <div className="space-y-2">
            {cupons.map((c) => (
              <div key={c.id} className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-green-600" />
                      <span className="font-bold text-sm text-gray-800 uppercase">{c.codigo}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {c.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    {c.descricao && <p className="text-xs text-gray-500 mt-0.5">{c.descricao}</p>}
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                      <span>
                        {c.tipo === 'percentual' ? `${c.valor}%` : formatCurrency(c.valor)} de desconto
                      </span>
                      <span>Usos: {c.usos}/{c.maxUsos}</span>
                      {c.minimo > 0 && <span>Min: {formatCurrency(c.minimo)}</span>}
                      {c.validade && <span>Val: {new Date(c.validade).toLocaleDateString('pt-BR')}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FIDELIDADE TAB */}
      {tab === 'fidelidade' && (
        <div className="space-y-2">
          {clientes.length === 0 && (
            <p className="text-center text-gray-400 py-8 text-sm">Nenhum cliente cadastrado</p>
          )}
          {clientes.map((c) => {
            const pontos = c.pontosFidelidade || 0
            const progresso = pontos % 10
            const elegivel = progresso === 9
            return (
              <div key={c.id} className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-800">{c.nome}</span>
                      {elegivel && (
                        <span className="flex items-center gap-0.5 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                          <Gift className="w-3 h-3" /> Proximo gratis!
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{c.telefone}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-bold text-gray-800">{pontos}</span>
                    </div>
                    <p className="text-xs text-gray-400">{progresso}/10 para gratis</p>
                    <div className="w-24 h-1.5 bg-gray-200 rounded-full mt-1">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${(progresso / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Novo Cupom */}
      {showFormCupom && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-3 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-800">Novo Cupom</h3>

            <input
              placeholder="Codigo (ex: BILL10)"
              value={formCupom.codigo}
              onChange={(e) => setFormCupom((p) => ({ ...p, codigo: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-green-500 uppercase"
            />
            <input
              placeholder="Descricao"
              value={formCupom.descricao}
              onChange={(e) => setFormCupom((p) => ({ ...p, descricao: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-green-500"
            />
            <select
              value={formCupom.tipo}
              onChange={(e) => setFormCupom((p) => ({ ...p, tipo: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="percentual">Percentual (%)</option>
              <option value="fixo">Valor Fixo (R$)</option>
            </select>
            <input
              type="number"
              placeholder={formCupom.tipo === 'percentual' ? 'Valor (ex: 10 para 10%)' : 'Valor (R$)'}
              value={formCupom.valor || ''}
              onChange={(e) => setFormCupom((p) => ({ ...p, valor: Number(e.target.value) }))}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-green-500"
            />
            <input
              type="number"
              placeholder="Valor minimo do pedido"
              value={formCupom.minimo || ''}
              onChange={(e) => setFormCupom((p) => ({ ...p, minimo: Number(e.target.value) }))}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-green-500"
            />
            <input
              type="number"
              placeholder="Max usos"
              value={formCupom.maxUsos}
              onChange={(e) => setFormCupom((p) => ({ ...p, maxUsos: Number(e.target.value) }))}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-green-500"
            />
            <div>
              <label className="text-xs text-gray-500">Validade (opcional)</label>
              <input
                type="date"
                value={formCupom.validade}
                onChange={(e) => setFormCupom((p) => ({ ...p, validade: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowFormCupom(false)}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={criarCupom}
                disabled={!formCupom.codigo || !formCupom.valor}
                className="flex-1 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
