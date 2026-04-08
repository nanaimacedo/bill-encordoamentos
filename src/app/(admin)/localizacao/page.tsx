'use client'

import { useState, useEffect, useCallback } from 'react'
import { MapPin, Navigation, Bell, Send, Truck, Check, Plus, Trash2, Loader2, AlertCircle, Users } from 'lucide-react'

interface Local {
  id: string
  nome: string
  endereco: string
  latitude: number
  longitude: number
  raio: number
  ativo: boolean
}

interface Encordoamento {
  id: string
  status: string
  tensao: number
  cliente: { id: string; nome: string }
  corda: { nome: string }
}

interface EstouAquiResult {
  local: string | null
  clientesNotificados: number
  detalhes: Array<{
    clienteId: string
    nome: string
    telefone: string
    motivos: string[]
    pushEnviado: boolean
  }>
  mensagem?: string
}

export default function LocalizacaoPage() {
  // Estou Aqui state
  const [geoLoading, setGeoLoading] = useState(false)
  const [estouAquiResult, setEstouAquiResult] = useState<EstouAquiResult | null>(null)
  const [geoError, setGeoError] = useState('')

  // Locais state
  const [locais, setLocais] = useState<Local[]>([])
  const [locaisLoading, setLocaisLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    endereco: '',
    latitude: '',
    longitude: '',
    raio: '500',
  })

  // Status Raquete state
  const [encordoamentos, setEncordoamentos] = useState<Encordoamento[]>([])
  const [selectedEnc, setSelectedEnc] = useState('')
  const [statusLoading, setStatusLoading] = useState('')
  const [toast, setToast] = useState('')

  const fetchLocais = useCallback(async () => {
    try {
      const res = await fetch('/api/locais')
      const data = await res.json()
      setLocais(data)
    } catch {
      console.error('Erro ao buscar locais')
    } finally {
      setLocaisLoading(false)
    }
  }, [])

  const fetchEncordoamentos = useCallback(async () => {
    try {
      const res = await fetch('/api/encordoamentos?status=pendente,em_andamento,pronto,saiu_delivery')
      const data = await res.json()
      if (Array.isArray(data)) {
        setEncordoamentos(data)
      } else if (data.encordoamentos) {
        setEncordoamentos(data.encordoamentos)
      }
    } catch {
      console.error('Erro ao buscar encordoamentos')
    }
  }, [])

  useEffect(() => {
    fetchLocais()
    fetchEncordoamentos()
  }, [fetchLocais, fetchEncordoamentos])

  // Estou Aqui handler
  const handleEstouAqui = async () => {
    setGeoLoading(true)
    setGeoError('')
    setEstouAquiResult(null)

    if (!navigator.geolocation) {
      setGeoError('Geolocalização não suportada neste navegador')
      setGeoLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch('/api/push/estou-aqui', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }),
          })
          const data = await res.json()
          setEstouAquiResult(data)
        } catch {
          setGeoError('Erro ao enviar localização')
        } finally {
          setGeoLoading(false)
        }
      },
      (err) => {
        setGeoError(`Erro ao obter localização: ${err.message}`)
        setGeoLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // Add Local
  const handleAddLocal = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/locais', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        setFormData({ nome: '', endereco: '', latitude: '', longitude: '', raio: '500' })
        setShowForm(false)
        fetchLocais()
        showToast('Local adicionado!')
      }
    } catch {
      showToast('Erro ao adicionar local')
    }
  }

  // Quick add presets
  const quickAdd = async (nome: string, lat: number, lng: number) => {
    try {
      const res = await fetch('/api/locais', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, endereco: '', latitude: lat, longitude: lng, raio: 500 }),
      })
      if (res.ok) {
        fetchLocais()
        showToast(`${nome} adicionado!`)
      }
    } catch {
      showToast('Erro ao adicionar')
    }
  }

  // Delete Local
  const handleDeleteLocal = async (id: string) => {
    if (!confirm('Remover este local?')) return
    try {
      await fetch(`/api/locais/${id}`, { method: 'DELETE' })
      fetchLocais()
      showToast('Local removido')
    } catch {
      showToast('Erro ao remover')
    }
  }

  // Status Raquete
  const handleStatusChange = async (novoStatus: string) => {
    if (!selectedEnc) return
    setStatusLoading(novoStatus)
    try {
      const res = await fetch('/api/push/status-raquete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encordoamentoId: selectedEnc, novoStatus }),
      })
      const data = await res.json()
      if (data.success) {
        showToast(`Status atualizado: ${data.notificacao.titulo}`)
        fetchEncordoamentos()
        setSelectedEnc('')
      } else {
        showToast('Erro ao atualizar status')
      }
    } catch {
      showToast('Erro ao atualizar status')
    } finally {
      setStatusLoading('')
    }
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const selectedEncData = encordoamentos.find((e) => e.id === selectedEnc)

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-8 pb-24 md:pb-8">
      <h1 className="text-2xl font-bold text-foreground font-heading flex items-center gap-2">
        <MapPin className="text-primary-600" size={28} />
        Localização & Notificações
      </h1>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg animate-pulse">
          {toast}
        </div>
      )}

      {/* Section 1: Estou Aqui */}
      <section className="bg-white rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Navigation size={20} className="text-green-600" />
          Estou Aqui
        </h2>
        <p className="text-sm text-foreground-muted mb-4">
          Clique para enviar sua localização e notificar clientes próximos com raquetes prontas ou pagamentos pendentes.
        </p>

        <button
          onClick={handleEstouAqui}
          disabled={geoLoading}
          className="w-full md:w-auto px-8 py-4 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-xl text-lg font-bold transition-colors flex items-center justify-center gap-3 shadow-lg"
        >
          {geoLoading ? (
            <>
              <Loader2 size={24} className="animate-spin" />
              Obtendo localização...
            </>
          ) : (
            <>
              <MapPin size={24} />
              Estou Aqui
            </>
          )}
        </button>

        {geoError && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle size={18} />
            {geoError}
          </div>
        )}

        {estouAquiResult && (
          <div className="mt-4 space-y-3">
            {estouAquiResult.local ? (
              <>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="font-semibold text-green-800 flex items-center gap-2">
                    <MapPin size={18} />
                    Local: {estouAquiResult.local}
                  </p>
                  <p className="text-green-700 mt-1 flex items-center gap-2">
                    <Users size={18} />
                    {estouAquiResult.clientesNotificados} cliente(s) notificado(s)
                  </p>
                </div>
                {estouAquiResult.detalhes.length > 0 && (
                  <div className="space-y-2">
                    {estouAquiResult.detalhes.map((d) => (
                      <div key={d.clienteId} className="p-3 bg-background-secondary rounded-lg">
                        <p className="font-medium text-foreground">{d.nome}</p>
                        <p className="text-sm text-foreground-muted">{d.telefone}</p>
                        <p className="text-sm text-foreground-muted">{d.motivos.join(', ')}</p>
                        {d.pushEnviado && (
                          <span className="text-xs text-green-600 flex items-center gap-1 mt-1">
                            <Bell size={12} /> Push enviado
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-yellow-800 flex items-center gap-2">
                  <AlertCircle size={18} />
                  Nenhum condomínio próximo encontrado
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Section 2: Locais Cadastrados */}
      <section className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <MapPin size={20} className="text-primary-600" />
            Locais Cadastrados
          </h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
          >
            <Plus size={16} />
            Novo Local
          </button>
        </div>

        {/* Quick add buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => quickAdd('Lorian', -23.5505, -46.6333)}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors"
          >
            + Adicionar Lorian
          </button>
          <button
            onClick={() => quickAdd('CPB', -23.5600, -46.6400)}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors"
          >
            + Adicionar CPB
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleAddLocal} className="mb-4 p-4 bg-background-secondary rounded-lg space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Nome</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                  placeholder="Ex: Lorian, CPB, Riviera"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Endereço</label>
                <input
                  type="text"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                  placeholder="Endereço completo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                  placeholder="-23.5505"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                  placeholder="-46.6333"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Raio (metros)</label>
                <input
                  type="number"
                  value={formData.raio}
                  onChange={(e) => setFormData({ ...formData, raio: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                  placeholder="500"
                />
              </div>
            </div>
            <p className="text-xs text-foreground-muted">
              Dica: Use Google Maps: clique com botão direito e copie as coordenadas
            </p>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-background-secondary hover:bg-gray-200 text-foreground rounded-lg text-sm font-medium transition-colors border border-border"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {locaisLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={24} className="animate-spin text-foreground-muted" />
          </div>
        ) : locais.length === 0 ? (
          <p className="text-sm text-foreground-muted py-4">Nenhum local cadastrado. Adicione um local acima.</p>
        ) : (
          <div className="space-y-2">
            {locais.map((local) => (
              <div
                key={local.id}
                className="flex items-center justify-between p-3 bg-background-secondary rounded-lg"
              >
                <div>
                  <p className="font-medium text-foreground">{local.nome}</p>
                  <p className="text-sm text-foreground-muted">
                    {local.endereco && `${local.endereco} | `}
                    Raio: {local.raio}m | Lat: {local.latitude.toFixed(4)}, Lng: {local.longitude.toFixed(4)}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteLocal(local.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section 3: Notificar Status */}
      <section className="bg-white rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Bell size={20} className="text-primary-600" />
          Notificar Status da Raquete
        </h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-foreground mb-1">Selecionar Encordoamento</label>
          <select
            value={selectedEnc}
            onChange={(e) => setSelectedEnc(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white"
          >
            <option value="">Selecione um encordoamento...</option>
            {encordoamentos.map((enc) => (
              <option key={enc.id} value={enc.id}>
                {enc.cliente?.nome || 'Cliente'} - {enc.corda?.nome || 'Avulsa'} ({enc.status})
              </option>
            ))}
          </select>
        </div>

        {selectedEncData && (
          <div className="mb-4 p-3 bg-background-secondary rounded-lg">
            <p className="font-medium text-foreground">{selectedEncData.cliente?.nome || 'Cliente'}</p>
            <p className="text-sm text-foreground-muted">
              Corda: {selectedEncData.corda?.nome || 'Avulsa'} | Tensão: {selectedEncData.tensao}lbs | Status: {selectedEncData.status}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button
            onClick={() => handleStatusChange('em_andamento')}
            disabled={!selectedEnc || statusLoading === 'em_andamento'}
            className="flex flex-col items-center gap-1 px-3 py-3 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 text-blue-700 rounded-lg text-sm font-medium transition-colors"
          >
            {statusLoading === 'em_andamento' ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            Em Andamento
          </button>
          <button
            onClick={() => handleStatusChange('pronto')}
            disabled={!selectedEnc || statusLoading === 'pronto'}
            className="flex flex-col items-center gap-1 px-3 py-3 bg-green-50 hover:bg-green-100 disabled:opacity-50 text-green-700 rounded-lg text-sm font-medium transition-colors"
          >
            {statusLoading === 'pronto' ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
            Pronto
          </button>
          <button
            onClick={() => handleStatusChange('saiu_delivery')}
            disabled={!selectedEnc || statusLoading === 'saiu_delivery'}
            className="flex flex-col items-center gap-1 px-3 py-3 bg-orange-50 hover:bg-orange-100 disabled:opacity-50 text-orange-700 rounded-lg text-sm font-medium transition-colors"
          >
            {statusLoading === 'saiu_delivery' ? <Loader2 size={20} className="animate-spin" /> : <Truck size={20} />}
            Saiu Delivery
          </button>
          <button
            onClick={() => handleStatusChange('entregue')}
            disabled={!selectedEnc || statusLoading === 'entregue'}
            className="flex flex-col items-center gap-1 px-3 py-3 bg-purple-50 hover:bg-purple-100 disabled:opacity-50 text-purple-700 rounded-lg text-sm font-medium transition-colors"
          >
            {statusLoading === 'entregue' ? <Loader2 size={20} className="animate-spin" /> : <Navigation size={20} />}
            Entregue
          </button>
        </div>
      </section>
    </div>
  )
}
