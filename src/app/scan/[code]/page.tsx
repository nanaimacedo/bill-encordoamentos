'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { User, Clock, DollarSign, Package, Truck } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface ScanData {
  tipo: 'cliente' | 'raquete'
  cliente: {
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
  }
  raquete?: { id: string; marca: string; modelo: string }
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

export default function ScanPage() {
  const params = useParams()
  const [data, setData] = useState<ScanData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [solicitando, setSolicitando] = useState<string | null>(null)

  useEffect(() => {
    if (!params.code) return
    fetch(`/api/qrcode/scan/${params.code}`)
      .then(r => {
        if (!r.ok) throw new Error('Não encontrado')
        return r.json()
      })
      .then(setData)
      .catch(() => setError('QR Code inválido ou não encontrado.'))
      .finally(() => setLoading(false))
  }, [params.code])

  const solicitarRetirada = async (encId: string) => {
    setSolicitando(encId)
    try {
      const res = await fetch(`/api/encordoamentos/solicitar-retirada/${encId}`, { method: 'PUT' })
      if (res.ok) {
        // Reload data
        const r = await fetch(`/api/qrcode/scan/${params.code}`)
        setData(await r.json())
      }
    } catch { /* ignore */ }
    setSolicitando(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Carregando...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Ops!</h1>
          <p className="text-gray-500">{error || 'QR Code não encontrado'}</p>
        </div>
      </div>
    )
  }

  const totalDebito = data.cliente.encordoamentos
    .filter(e => e.pagamento?.status === 'pendente')
    .reduce((sum, e) => sum + (e.pagamento?.valor || 0), 0)

  const encProntos = data.cliente.encordoamentos.filter(e => e.status === 'pronto')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-green-600 text-white px-4 py-6 text-center">
        <h1 className="text-xl font-bold">Bill Encordoamentos</h1>
        <p className="text-green-100 text-sm mt-1">
          {data.raquete ? `Raquete: ${data.raquete.marca} ${data.raquete.modelo}` : 'Perfil do Cliente'}
        </p>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-4">
        {/* Client info */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">{data.cliente.nome}</h2>
              <p className="text-sm text-gray-500">{data.cliente.telefone}</p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {encProntos.length > 0 && (
          <div className="bg-green-50 rounded-2xl p-4 border border-green-200 space-y-2">
            <p className="font-semibold text-green-700 text-sm flex items-center gap-2">
              <Package className="w-4 h-4" /> Pronto para retirada!
            </p>
            {encProntos.map(e => (
              <div key={e.id} className="flex items-center justify-between">
                <span className="text-sm text-green-600">{e.corda.nome} - {e.tensao}lbs</span>
                <button
                  onClick={() => solicitarRetirada(e.id)}
                  disabled={solicitando === e.id}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {e.entrega === 'delivery' ? (
                    <><Truck className="w-3 h-3" /> Solicitar Delivery</>
                  ) : (
                    <><Package className="w-3 h-3" /> {solicitando === e.id ? 'Solicitando...' : 'Solicitar Retirada'}</>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

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

        {/* History */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Histórico
          </h3>
          <div className="space-y-2">
            {data.cliente.encordoamentos.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Nenhum encordoamento</p>
            ) : (
              data.cliente.encordoamentos.map(enc => (
                <div key={enc.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{enc.corda.nome}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[enc.status]}`}>
                      {statusLabels[enc.status]}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{enc.tensao}lbs - {formatCurrency(enc.preco)}</span>
                    <span>{formatDate(enc.createdAt)}</span>
                  </div>
                  {enc.entrega === 'delivery' && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-blue-600">
                      <Truck className="w-3 h-3" /> Delivery
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
