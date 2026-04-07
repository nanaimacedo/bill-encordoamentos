'use client'

import { useState } from 'react'
import { Clock, DollarSign, Package, Truck, RotateCcw, Check } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface ClientePortal {
  id: string
  nome: string
  telefone: string
  condominio: string | null
  apartamento: string | null
  encordoamentos: {
    id: string
    tensao: number
    preco: number
    status: string
    entrega: string
    createdAt: string
    corda: { nome: string; marca: string }
    pagamento: { status: string; valor: number } | null
  }[]
  pagamentos: { id: string; valor: number; status: string }[]
}

const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  pronto: 'Pronto para retirada',
  entregue: 'Entregue',
}

const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-700',
  em_andamento: 'bg-blue-100 text-blue-700',
  pronto: 'bg-green-100 text-green-700',
  entregue: 'bg-gray-100 text-gray-600',
}

export default function PortalClientePage() {
  const [telefone, setTelefone] = useState('')
  const [cliente, setCliente] = useState<ClientePortal | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [solicitando, setSolicitando] = useState<string | null>(null)
  const [solicitado, setSolicitado] = useState<Set<string>>(new Set())

  const buscar = async () => {
    if (!telefone.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/clientes?q=${encodeURIComponent(telefone)}`)
      const data = await res.json()
      if (data.length === 0) {
        setError('Nenhum cliente encontrado com esse telefone')
        setCliente(null)
      } else {
        const detailRes = await fetch(`/api/clientes/${data[0].id}`)
        setCliente(await detailRes.json())
      }
    } catch {
      setError('Erro ao buscar')
    } finally {
      setLoading(false)
    }
  }

  const recarregar = async () => {
    if (!cliente) return
    const res = await fetch(`/api/clientes/${cliente.id}`)
    setCliente(await res.json())
  }

  const solicitarRetirada = async (encId: string) => {
    setSolicitando(encId)
    try {
      const res = await fetch(`/api/encordoamentos/solicitar-retirada/${encId}`, { method: 'PUT' })
      if (res.ok) {
        setSolicitado(prev => new Set(prev).add(encId))
        await recarregar()
      }
    } catch { /* ignore */ }
    setSolicitando(null)
  }

  const repetirPedido = async () => {
    if (!cliente || cliente.encordoamentos.length === 0) return
    const ultimo = cliente.encordoamentos[0]
    setLoading(true)
    try {
      const res = await fetch('/api/encordoamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId: cliente.id,
          cordaId: ultimo.corda ? undefined : undefined, // need cordaId from last enc
          tensao: ultimo.tensao,
          preco: ultimo.preco,
          tipo: 'padrao',
          entrega: ultimo.entrega || 'retirada',
        }),
      })
      if (res.ok) {
        await recarregar()
      }
    } catch { /* ignore */ }
    setLoading(false)
  }

  const totalDebito = cliente?.pagamentos
    .filter(p => p.status === 'pendente')
    .reduce((sum, p) => sum + p.valor, 0) || 0

  const encProntos = cliente?.encordoamentos.filter(e => e.status === 'pronto') || []

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-green-600 text-white px-4 py-6 text-center">
        <h1 className="text-xl font-bold">Bill Encordoamentos</h1>
        <p className="text-green-100 text-sm mt-1">Portal do Cliente</p>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-4">
        {!cliente ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 text-center">Acesse seu histórico</h2>
            <p className="text-sm text-gray-500 text-center">Digite seu telefone para consultar</p>
            <input
              type="tel"
              placeholder="(00) 00000-0000"
              value={telefone}
              onChange={e => setTelefone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && buscar()}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-center text-lg outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={buscar}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Buscando...' : 'Consultar'}
            </button>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          </div>
        ) : (
          <>
            {/* Boas vindas */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Olá, {cliente.nome.split(' ')[0]}!</h2>
                  <p className="text-xs text-gray-500">{cliente.telefone}</p>
                </div>
                <button
                  onClick={() => { setCliente(null); setTelefone(''); setSolicitado(new Set()) }}
                  className="text-xs text-green-600 underline"
                >
                  Sair
                </button>
              </div>
            </div>

            {/* Pronto para retirada/delivery */}
            {encProntos.length > 0 && (
              <div className="bg-green-50 rounded-2xl p-4 border border-green-200 space-y-3">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-700 text-sm">Pronto!</span>
                </div>
                {encProntos.map(e => (
                  <div key={e.id} className="flex items-center justify-between bg-white rounded-xl p-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{e.corda.nome} - {e.tensao}lbs</p>
                      <p className="text-xs text-gray-500">{formatCurrency(e.preco)}</p>
                    </div>
                    {solicitado.has(e.id) ? (
                      <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                        <Check className="w-3 h-3" /> Solicitado
                      </span>
                    ) : (
                      <button
                        onClick={() => solicitarRetirada(e.id)}
                        disabled={solicitando === e.id}
                        className="flex items-center gap-1 px-3 py-2 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-50"
                      >
                        {e.entrega === 'delivery' ? (
                          <><Truck className="w-3 h-3" /> {solicitando === e.id ? '...' : 'Pedir Delivery'}</>
                        ) : (
                          <><Package className="w-3 h-3" /> {solicitando === e.id ? '...' : 'Solicitar Retirada'}</>
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Débito */}
            {totalDebito > 0 && (
              <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-red-600" />
                  <div>
                    <span className="font-semibold text-red-700 text-sm">Débito em aberto</span>
                    <p className="text-lg font-bold text-red-700">{formatCurrency(totalDebito)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Histórico */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Seus Encordoamentos
              </h3>
              <div className="space-y-2">
                {cliente.encordoamentos.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">Nenhum encordoamento ainda</p>
                )}
                {cliente.encordoamentos.map(enc => (
                  <div key={enc.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm text-gray-800">{enc.corda.nome}</span>
                      <div className="flex items-center gap-1">
                        {enc.entrega === 'delivery' && <Truck className="w-3 h-3 text-blue-500" />}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[enc.status]}`}>
                          {statusLabels[enc.status]}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{enc.tensao} lbs</span>
                      <span>{formatDate(enc.createdAt)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="text-gray-600 font-medium">{formatCurrency(enc.preco)}</span>
                      {enc.pagamento && (
                        <span className={`${enc.pagamento.status === 'pago' ? 'text-green-600' : 'text-red-500'}`}>
                          {enc.pagamento.status === 'pago' ? 'Pago' : 'Pendente'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
