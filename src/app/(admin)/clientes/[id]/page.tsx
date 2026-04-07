'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Phone, MapPin, Clock, DollarSign, QrCode, Plus, Download, Truck, Store } from 'lucide-react'
import { formatCurrency, formatDate, daysSince } from '@/lib/utils'

interface Encordoamento {
  id: string
  tensao: number
  preco: number
  status: string
  entrega?: string
  createdAt: string
  corda: { nome: string; marca: string }
  pagamento: { status: string } | null
}

interface Raquete {
  id: string
  marca: string
  modelo: string
  qrCode: string
}

interface ClienteDetail {
  id: string
  nome: string
  telefone: string
  condominio: string | null
  apartamento: string | null
  qrCode: string | null
  centroReceita?: string
  createdAt: string
  encordoamentos: Encordoamento[]
  pagamentos: { id: string; valor: number; status: string; createdAt: string }[]
  raquetes: Raquete[]
}

const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-700',
  em_andamento: 'bg-blue-100 text-blue-700',
  pronto: 'bg-green-100 text-green-700',
  entregue: 'bg-gray-100 text-gray-600',
  pago: 'bg-green-100 text-green-700',
}

const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  pronto: 'Pronto',
  entregue: 'Entregue',
  pago: 'Pago',
}

export default function ClienteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [cliente, setCliente] = useState<ClienteDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [qrCodeImg, setQrCodeImg] = useState<string | null>(null)
  const [showQr, setShowQr] = useState(false)
  const [showAddRaquete, setShowAddRaquete] = useState(false)
  const [raqueteForm, setRaqueteForm] = useState({ marca: '', modelo: '' })
  const [raqueteQr, setRaqueteQr] = useState<{ img: string; marca: string; modelo: string } | null>(null)

  const carregar = () => {
    if (!params.id) return
    fetch(`/api/clientes/${params.id}`)
      .then(r => r.json())
      .then(setCliente)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { carregar() }, [params.id])

  const gerarQrCliente = async () => {
    const res = await fetch(`/api/qrcode/gerar/${params.id}`)
    if (res.ok) {
      const data = await res.json()
      setQrCodeImg(data.qrCodeData)
      setShowQr(true)
      carregar()
    }
  }

  const adicionarRaquete = async () => {
    if (!raqueteForm.marca || !raqueteForm.modelo) return
    const res = await fetch('/api/raquetes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...raqueteForm, clienteId: params.id }),
    })
    if (res.ok) {
      setShowAddRaquete(false)
      setRaqueteForm({ marca: '', modelo: '' })
      carregar()
    }
  }

  const gerarQrRaquete = async (raqueteId: string) => {
    const res = await fetch(`/api/raquetes/${raqueteId}/qrcode`)
    if (res.ok) {
      const data = await res.json()
      const raq = cliente?.raquetes.find(r => r.id === raqueteId)
      setRaqueteQr({
        img: data.qrCodeData,
        marca: raq?.marca || '',
        modelo: raq?.modelo || '',
      })
    }
  }

  if (loading) {
    return <div className="p-4"><div className="animate-pulse h-48 bg-white rounded-xl" /></div>
  }

  if (!cliente) {
    return <div className="p-4 text-center text-gray-400">Cliente não encontrado</div>
  }

  const totalEmAberto = cliente.pagamentos
    .filter(p => p.status === 'pendente')
    .reduce((sum, p) => sum + p.valor, 0)

  const ultimoEnc = cliente.encordoamentos[0]
  const frequencia = cliente.encordoamentos.length >= 2
    ? Math.round(
        cliente.encordoamentos.slice(0, -1).reduce((sum, enc, i) => {
          const next = cliente.encordoamentos[i + 1]
          return sum + daysSince(next.createdAt) - daysSince(enc.createdAt)
        }, 0) / (cliente.encordoamentos.length - 1)
      )
    : null

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-lg mx-auto">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      {/* Info + QR Code */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">{cliente.nome}</h1>
          <button
            onClick={gerarQrCliente}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100"
          >
            <QrCode className="w-4 h-4" /> QR Code
          </button>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Phone className="w-4 h-4" /> {cliente.telefone}
        </div>
        {cliente.condominio && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" /> {cliente.condominio} {cliente.apartamento && `- Apt ${cliente.apartamento}`}
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Store className="w-4 h-4" /> Centro: {cliente.centroReceita === 'delivery' ? 'Delivery' : 'Loja (Clube)'}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" /> Cliente desde {formatDate(cliente.createdAt)}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
          <p className="text-lg font-bold text-gray-800">{cliente.encordoamentos.length}</p>
          <p className="text-xs text-gray-500 uppercase">Encordoamentos</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
          <p className="text-lg font-bold text-red-600">{formatCurrency(totalEmAberto)}</p>
          <p className="text-xs text-gray-500 uppercase">Em aberto</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
          <p className="text-lg font-bold text-gray-800">{frequencia ? `${frequencia}d` : '-'}</p>
          <p className="text-xs text-gray-500 uppercase">Freq. troca</p>
        </div>
      </div>

      {/* Sugestão */}
      {ultimoEnc && daysSince(ultimoEnc.createdAt) > 30 && (
        <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-200">
          <p className="text-sm text-yellow-800">
            <strong>Sugestão:</strong> Último encordoamento há {daysSince(ultimoEnc.createdAt)} dias.
          </p>
        </div>
      )}

      {/* Raquetes */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-700">Raquetes</h2>
          <button
            onClick={() => setShowAddRaquete(true)}
            className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700"
          >
            <Plus className="w-3 h-3" /> Adicionar
          </button>
        </div>
        <div className="space-y-2">
          {(!cliente.raquetes || cliente.raquetes.length === 0) && (
            <p className="text-sm text-gray-400 text-center py-2">Nenhuma raquete cadastrada</p>
          )}
          {cliente.raquetes?.map(raq => (
            <div key={raq.id} className="bg-white rounded-xl p-3 border border-gray-100 flex items-center justify-between">
              <span className="text-sm text-gray-800">{raq.marca} {raq.modelo}</span>
              <button
                onClick={() => gerarQrRaquete(raq.id)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-blue-600 text-xs hover:bg-blue-100"
              >
                <QrCode className="w-3 h-3" /> Etiqueta
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Histórico */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Histórico de Encordoamentos</h2>
        <div className="space-y-2">
          {cliente.encordoamentos.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">Nenhum encordoamento ainda</p>
          )}
          {cliente.encordoamentos.map(enc => (
            <div key={enc.id} className="bg-white rounded-xl p-3 border border-gray-100">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm text-gray-800">{enc.corda.nome}</span>
                <div className="flex items-center gap-1">
                  {enc.entrega === 'delivery' && <Truck className="w-3 h-3 text-blue-500" />}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[enc.status] || 'bg-gray-100 text-gray-600'}`}>
                    {statusLabels[enc.status] || enc.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{enc.tensao} lbs - {formatCurrency(enc.preco)}</span>
                <span>{formatDate(enc.createdAt)}</span>
              </div>
              {enc.pagamento && (
                <div className="mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[enc.pagamento.status]}`}>
                    <DollarSign className="w-3 h-3 inline" /> {statusLabels[enc.pagamento.status]}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal QR Code Cliente */}
      {showQr && qrCodeImg && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center space-y-4">
            <h3 className="text-lg font-bold text-gray-800">QR Code - {cliente.nome}</h3>
            <img src={qrCodeImg} alt="QR Code" className="w-40 h-40 sm:w-48 sm:h-48 mx-auto" />
            <p className="text-xs text-gray-500">
              Escaneie para abrir o cadastro e histórico do cliente
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowQr(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600">
                Fechar
              </button>
              <a
                href={qrCodeImg}
                download={`qrcode-${cliente.nome.replace(/\s/g, '-')}.png`}
                className="flex-1 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium flex items-center justify-center gap-1"
              >
                <Download className="w-4 h-4" /> Baixar
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modal QR Code Raquete */}
      {raqueteQr && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Etiqueta - {raqueteQr.marca} {raqueteQr.modelo}</h3>
            <img src={raqueteQr.img} alt="QR Code Raquete" className="w-40 h-40 sm:w-48 sm:h-48 mx-auto" />
            <p className="text-xs text-gray-500">
              Cole na raquete. Ao escanear, abre o cadastro do cliente.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setRaqueteQr(null)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600">
                Fechar
              </button>
              <a
                href={raqueteQr.img}
                download={`etiqueta-${raqueteQr.marca}-${raqueteQr.modelo}.png`}
                className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium flex items-center justify-center gap-1"
              >
                <Download className="w-4 h-4" /> Baixar
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modal Adicionar Raquete */}
      {showAddRaquete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Nova Raquete</h3>
            <input
              placeholder="Marca (ex: Babolat, Wilson) *"
              value={raqueteForm.marca}
              onChange={e => setRaqueteForm(p => ({ ...p, marca: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-green-500"
            />
            <input
              placeholder="Modelo (ex: Pure Drive, Blade) *"
              value={raqueteForm.modelo}
              onChange={e => setRaqueteForm(p => ({ ...p, modelo: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-green-500"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowAddRaquete(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600">Cancelar</button>
              <button onClick={adicionarRaquete} className="flex-1 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
