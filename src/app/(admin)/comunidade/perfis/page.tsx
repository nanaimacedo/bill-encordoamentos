'use client'

import { useEffect, useState } from 'react'
import { UserCircle, Users, Trophy, Calendar, Star, Swords, Plus, Check, X, Send, ChevronDown } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

interface Cliente {
  id: string
  nome: string
  telefone: string
}

interface Perfil {
  id: string
  clienteId: string
  nivel: string
  estiloJogo: string
  maoHabil: string
  disponibilidade: string
  regiao: string
  bio: string
  cliente: Cliente
}

interface Convite {
  id: string
  remetenteId: string
  destinatarioId: string
  data: string
  local: string
  mensagem: string
  status: string
  createdAt: string
  remetente: { id: string; cliente: { id: string; nome: string } }
  destinatario: { id: string; cliente: { id: string; nome: string } }
}

interface Evento {
  id: string
  titulo: string
  descricao: string
  tipo: string
  data: string
  local: string
  vagas: number
  inscritos: number
  ativo: boolean
}

interface Avaliacao {
  id: string
  nota: number
  comentario: string
  createdAt: string
  cliente: { id: string; nome: string }
  corda: { id: string; nome: string; marca: string }
}

interface Corda {
  id: string
  nome: string
  marca: string
}

const TABS = [
  { id: 'perfis', label: 'Perfis', icon: UserCircle },
  { id: 'matchmaking', label: 'Matchmaking', icon: Swords },
  { id: 'convites', label: 'Convites', icon: Users },
  { id: 'eventos', label: 'Eventos', icon: Calendar },
  { id: 'avaliacoes', label: 'Avaliacoes', icon: Star },
]

const NIVEIS = ['iniciante', 'intermediario', 'avancado', 'profissional']
const ESTILOS = ['agressivo', 'defensivo', 'all-court']
const MAOS = ['direita', 'esquerda', 'ambidestro']
const TIPOS_EVENTO = ['torneio', 'social', 'aula', 'evento']

const nivelColor: Record<string, string> = {
  iniciante: 'bg-blue-100 text-blue-700',
  intermediario: 'bg-yellow-100 text-yellow-700',
  avancado: 'bg-orange-100 text-orange-700',
  profissional: 'bg-red-100 text-red-700',
}

export default function ComunidadePerfisPage() {
  const [tab, setTab] = useState('perfis')
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [perfis, setPerfis] = useState<Perfil[]>([])
  const [convites, setConvites] = useState<Convite[]>([])
  const [eventos, setEventos] = useState<Evento[]>([])
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
  const [mediaAvaliacoes, setMediaAvaliacoes] = useState(0)
  const [cordas, setCordas] = useState<Corda[]>([])
  const [loading, setLoading] = useState(true)

  // Matchmaking state
  const [matchClienteId, setMatchClienteId] = useState('')
  const [matchResults, setMatchResults] = useState<Perfil[]>([])
  const [matchLoading, setMatchLoading] = useState(false)

  // Convite form state
  const [conviteForm, setConviteForm] = useState({ destinatarioId: '', data: '', local: '', mensagem: '' })
  const [conviteRemetenteId, setConviteRemetenteId] = useState('')

  // Perfil form state
  const [perfilForm, setPerfilForm] = useState({
    clienteId: '', nivel: 'iniciante', estiloJogo: '', maoHabil: 'direita',
    disponibilidade: '', regiao: '', bio: '',
  })
  const [showPerfilForm, setShowPerfilForm] = useState(false)

  // Evento form state
  const [eventoForm, setEventoForm] = useState({
    titulo: '', descricao: '', tipo: 'torneio', data: '', local: '', vagas: 16,
  })
  const [showEventoForm, setShowEventoForm] = useState(false)

  // Avaliacao form state
  const [avaliacaoForm, setAvaliacaoForm] = useState({
    clienteId: '', cordaId: '', nota: 5, comentario: '',
  })
  const [showAvaliacaoForm, setShowAvaliacaoForm] = useState(false)

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    setLoading(true)
    try {
      const [clientesRes, cordasRes, eventosRes, avaliacoesRes] = await Promise.all([
        fetch('/api/clientes'),
        fetch('/api/cordas'),
        fetch('/api/eventos'),
        fetch('/api/avaliacoes'),
      ])
      const clientesData = await clientesRes.json()
      const cordasData = await cordasRes.json()
      const eventosData = await eventosRes.json()
      const avaliacoesData = await avaliacoesRes.json()

      setClientes(clientesData)
      setCordas(cordasData)
      setEventos(eventosData)
      setAvaliacoes(avaliacoesData.avaliacoes || [])
      setMediaAvaliacoes(avaliacoesData.media || 0)

      // Load all profiles
      const perfisPromises = clientesData.map((c: Cliente) =>
        fetch(`/api/perfil?clienteId=${c.id}`).then(r => r.json())
      )
      const perfisData = await Promise.all(perfisPromises)
      setPerfis(perfisData.filter(Boolean).filter((p: Perfil | null) => p && p.id))
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
    setLoading(false)
  }

  const buscarMatchmaking = async () => {
    if (!matchClienteId) return
    setMatchLoading(true)
    try {
      const res = await fetch(`/api/matchmaking?clienteId=${matchClienteId}`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setMatchResults(data)
      } else {
        setMatchResults([])
      }
    } catch {
      setMatchResults([])
    }
    setMatchLoading(false)
  }

  const salvarPerfil = async () => {
    if (!perfilForm.clienteId) return
    await fetch('/api/perfil', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(perfilForm),
    })
    setShowPerfilForm(false)
    setPerfilForm({ clienteId: '', nivel: 'iniciante', estiloJogo: '', maoHabil: 'direita', disponibilidade: '', regiao: '', bio: '' })
    carregarDados()
  }

  const carregarConvites = async (perfilId: string) => {
    const res = await fetch(`/api/convites?perfilId=${perfilId}`)
    setConvites(await res.json())
  }

  const enviarConvite = async () => {
    if (!conviteRemetenteId || !conviteForm.destinatarioId || !conviteForm.data || !conviteForm.local) return
    await fetch('/api/convites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remetenteId: conviteRemetenteId, ...conviteForm }),
    })
    setConviteForm({ destinatarioId: '', data: '', local: '', mensagem: '' })
    if (conviteRemetenteId) carregarConvites(conviteRemetenteId)
  }

  const responderConvite = async (id: string, status: string) => {
    await fetch(`/api/convites/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (conviteRemetenteId) carregarConvites(conviteRemetenteId)
  }

  const criarEvento = async () => {
    if (!eventoForm.titulo || !eventoForm.data || !eventoForm.local) return
    await fetch('/api/eventos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventoForm),
    })
    setShowEventoForm(false)
    setEventoForm({ titulo: '', descricao: '', tipo: 'torneio', data: '', local: '', vagas: 16 })
    const res = await fetch('/api/eventos')
    setEventos(await res.json())
  }

  const inscreverEvento = async (id: string) => {
    await fetch(`/api/eventos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incrementInscritos: true }),
    })
    const res = await fetch('/api/eventos')
    setEventos(await res.json())
  }

  const salvarAvaliacao = async () => {
    if (!avaliacaoForm.clienteId || !avaliacaoForm.cordaId) return
    await fetch('/api/avaliacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(avaliacaoForm),
    })
    setShowAvaliacaoForm(false)
    setAvaliacaoForm({ clienteId: '', cordaId: '', nota: 5, comentario: '' })
    const res = await fetch('/api/avaliacoes')
    const data = await res.json()
    setAvaliacoes(data.avaliacoes || [])
    setMediaAvaliacoes(data.media || 0)
  }

  const renderStars = (nota: number, interactive = false, onChange?: (n: number) => void) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          className={`w-4 h-4 ${n <= nota ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} ${interactive ? 'cursor-pointer' : ''}`}
          onClick={() => interactive && onChange?.(n)}
        />
      ))}
    </div>
  )

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <div className="bg-white rounded-xl p-6 animate-pulse h-24" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-xl p-6 animate-pulse h-40" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-4 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-green-100 rounded-xl">
          <Trophy className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Comunidade</h1>
          <p className="text-sm text-gray-500">{perfis.length} jogadores registrados</p>
        </div>
      </div>

      {/* Tabs - mobile horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* ====== PERFIS TAB ====== */}
      {tab === 'perfis' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-700">Jogadores</h2>
            <button
              onClick={() => setShowPerfilForm(!showPerfilForm)}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
            >
              <Plus className="w-4 h-4" /> Novo Perfil
            </button>
          </div>

          {showPerfilForm && (
            <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-3">
              <h3 className="font-medium text-sm text-gray-700">Criar/Editar Perfil</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Cliente</label>
                  <select
                    value={perfilForm.clienteId}
                    onChange={e => setPerfilForm({ ...perfilForm, clienteId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  >
                    <option value="">Selecione...</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Nivel</label>
                  <select
                    value={perfilForm.nivel}
                    onChange={e => setPerfilForm({ ...perfilForm, nivel: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  >
                    {NIVEIS.map(n => <option key={n} value={n}>{n.charAt(0).toUpperCase() + n.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Estilo de Jogo</label>
                  <select
                    value={perfilForm.estiloJogo}
                    onChange={e => setPerfilForm({ ...perfilForm, estiloJogo: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  >
                    <option value="">Selecione...</option>
                    {ESTILOS.map(e => <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Mao Habil</label>
                  <select
                    value={perfilForm.maoHabil}
                    onChange={e => setPerfilForm({ ...perfilForm, maoHabil: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  >
                    {MAOS.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Regiao</label>
                  <input
                    value={perfilForm.regiao}
                    onChange={e => setPerfilForm({ ...perfilForm, regiao: e.target.value })}
                    placeholder="Ex: Zona Sul, Centro..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Disponibilidade</label>
                  <input
                    value={perfilForm.disponibilidade}
                    onChange={e => setPerfilForm({ ...perfilForm, disponibilidade: e.target.value })}
                    placeholder="Ex: Seg/Qua/Sex manha"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Bio</label>
                <textarea
                  value={perfilForm.bio}
                  onChange={e => setPerfilForm({ ...perfilForm, bio: e.target.value })}
                  placeholder="Fale sobre voce..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm h-20 resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={salvarPerfil} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                  Salvar
                </button>
                <button onClick={() => setShowPerfilForm(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200">
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {perfis.map(p => (
              <div key={p.id} className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-full">
                    <UserCircle className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 truncate">{p.cliente.nome}</h3>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${nivelColor[p.nivel] || 'bg-gray-100 text-gray-600'}`}>
                      {p.nivel.charAt(0).toUpperCase() + p.nivel.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="mt-3 space-y-1 text-xs text-gray-500">
                  {p.estiloJogo && <p><span className="font-medium text-gray-600">Estilo:</span> {p.estiloJogo}</p>}
                  {p.regiao && <p><span className="font-medium text-gray-600">Regiao:</span> {p.regiao}</p>}
                  {p.maoHabil && <p><span className="font-medium text-gray-600">Mao:</span> {p.maoHabil}</p>}
                  {p.disponibilidade && <p><span className="font-medium text-gray-600">Horarios:</span> {p.disponibilidade}</p>}
                  {p.bio && <p className="text-gray-400 italic mt-2 line-clamp-2">{p.bio}</p>}
                </div>
              </div>
            ))}
            {perfis.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-400 text-sm">
                Nenhum perfil cadastrado. Clique em &quot;Novo Perfil&quot; para comecar.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====== MATCHMAKING TAB ====== */}
      {tab === 'matchmaking' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-3">
            <h2 className="font-semibold text-gray-700 flex items-center gap-2">
              <Swords className="w-5 h-5 text-green-600" /> Encontrar Parceiros de Jogo
            </h2>
            <p className="text-sm text-gray-500">Selecione um cliente para encontrar jogadores compativeis (mesmo nivel e regiao).</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={matchClienteId}
                onChange={e => setMatchClienteId(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm"
              >
                <option value="">Selecione um cliente...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              <button
                onClick={buscarMatchmaking}
                disabled={!matchClienteId || matchLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
              >
                {matchLoading ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
          </div>

          {matchResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-600">{matchResults.length} jogador(es) compativel(is)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {matchResults.map(p => (
                  <div key={p.id} className="bg-white rounded-xl p-4 border border-green-200 flex items-start gap-3">
                    <div className="p-2 bg-green-50 rounded-full">
                      <UserCircle className="w-8 h-8 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{p.cliente.nome}</h3>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${nivelColor[p.nivel] || 'bg-gray-100 text-gray-600'}`}>
                        {p.nivel}
                      </span>
                      {p.estiloJogo && <p className="text-xs text-gray-500 mt-1">Estilo: {p.estiloJogo}</p>}
                      {p.regiao && <p className="text-xs text-gray-500">Regiao: {p.regiao}</p>}
                    </div>
                    <button
                      onClick={() => {
                        const meuPerfil = perfis.find(pr => pr.clienteId === matchClienteId)
                        if (meuPerfil) {
                          setConviteRemetenteId(meuPerfil.id)
                          setConviteForm({ ...conviteForm, destinatarioId: p.id })
                          setTab('convites')
                        }
                      }}
                      className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" /> Convidar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {matchClienteId && !matchLoading && matchResults.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              Nenhum jogador compativel encontrado. Verifique se o cliente possui perfil.
            </div>
          )}
        </div>
      )}

      {/* ====== CONVITES TAB ====== */}
      {tab === 'convites' && (
        <div className="space-y-4">
          {/* Select profile to view invites */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-3">
            <h2 className="font-semibold text-gray-700 flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" /> Convites de Jogo
            </h2>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={conviteRemetenteId}
                onChange={e => {
                  setConviteRemetenteId(e.target.value)
                  if (e.target.value) carregarConvites(e.target.value)
                }}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm"
              >
                <option value="">Selecione um perfil...</option>
                {perfis.map(p => <option key={p.id} value={p.id}>{p.cliente.nome}</option>)}
              </select>
            </div>
          </div>

          {/* Send invite form */}
          {conviteRemetenteId && (
            <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-3">
              <h3 className="font-medium text-sm text-gray-700">Enviar Convite</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Convidar</label>
                  <select
                    value={conviteForm.destinatarioId}
                    onChange={e => setConviteForm({ ...conviteForm, destinatarioId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  >
                    <option value="">Selecione...</option>
                    {perfis.filter(p => p.id !== conviteRemetenteId).map(p => (
                      <option key={p.id} value={p.id}>{p.cliente.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Data/Hora</label>
                  <input
                    type="datetime-local"
                    value={conviteForm.data}
                    onChange={e => setConviteForm({ ...conviteForm, data: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Local</label>
                  <input
                    value={conviteForm.local}
                    onChange={e => setConviteForm({ ...conviteForm, local: e.target.value })}
                    placeholder="Ex: Quadra do Clube..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Mensagem</label>
                  <input
                    value={conviteForm.mensagem}
                    onChange={e => setConviteForm({ ...conviteForm, mensagem: e.target.value })}
                    placeholder="Opcional..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  />
                </div>
              </div>
              <button onClick={enviarConvite} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-1">
                <Send className="w-4 h-4" /> Enviar Convite
              </button>
            </div>
          )}

          {/* Invites list */}
          {conviteRemetenteId && convites.length > 0 && (
            <div className="space-y-2">
              {convites.map(c => {
                const enviado = c.remetenteId === conviteRemetenteId
                const statusColor = c.status === 'aceito' ? 'text-green-600 bg-green-50' :
                  c.status === 'recusado' ? 'text-red-600 bg-red-50' : 'text-yellow-600 bg-yellow-50'

                return (
                  <div key={c.id} className="bg-white rounded-xl p-4 border border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">
                        {enviado ? (
                          <>Voce convidou <span className="text-green-600">{c.destinatario.cliente.nome}</span></>
                        ) : (
                          <><span className="text-green-600">{c.remetente.cliente.nome}</span> te convidou</>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatDateTime(c.data)} - {c.local}
                      </p>
                      {c.mensagem && <p className="text-xs text-gray-400 italic mt-1">{c.mensagem}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                        {c.status}
                      </span>
                      {!enviado && c.status === 'pendente' && (
                        <div className="flex gap-1">
                          <button onClick={() => responderConvite(c.id, 'aceito')} className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => responderConvite(c.id, 'recusado')} className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {conviteRemetenteId && convites.length === 0 && (
            <p className="text-center py-8 text-gray-400 text-sm">Nenhum convite ainda.</p>
          )}
        </div>
      )}

      {/* ====== EVENTOS TAB ====== */}
      {tab === 'eventos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-700 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-600" /> Eventos
            </h2>
            <button
              onClick={() => setShowEventoForm(!showEventoForm)}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
            >
              <Plus className="w-4 h-4" /> Criar Evento
            </button>
          </div>

          {showEventoForm && (
            <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-3">
              <h3 className="font-medium text-sm text-gray-700">Novo Evento</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Titulo</label>
                  <input
                    value={eventoForm.titulo}
                    onChange={e => setEventoForm({ ...eventoForm, titulo: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Tipo</label>
                  <select
                    value={eventoForm.tipo}
                    onChange={e => setEventoForm({ ...eventoForm, tipo: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  >
                    {TIPOS_EVENTO.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Data/Hora</label>
                  <input
                    type="datetime-local"
                    value={eventoForm.data}
                    onChange={e => setEventoForm({ ...eventoForm, data: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Local</label>
                  <input
                    value={eventoForm.local}
                    onChange={e => setEventoForm({ ...eventoForm, local: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Vagas</label>
                  <input
                    type="number"
                    value={eventoForm.vagas}
                    onChange={e => setEventoForm({ ...eventoForm, vagas: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Descricao</label>
                <textarea
                  value={eventoForm.descricao}
                  onChange={e => setEventoForm({ ...eventoForm, descricao: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm h-20 resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={criarEvento} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                  Criar
                </button>
                <button onClick={() => setShowEventoForm(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200">
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {eventos.map(ev => {
              const lotado = ev.vagas > 0 && ev.inscritos >= ev.vagas
              const tipoColor: Record<string, string> = {
                torneio: 'bg-purple-100 text-purple-700',
                social: 'bg-blue-100 text-blue-700',
                aula: 'bg-green-100 text-green-700',
                evento: 'bg-orange-100 text-orange-700',
              }
              return (
                <div key={ev.id} className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${tipoColor[ev.tipo] || 'bg-gray-100 text-gray-600'}`}>
                        {ev.tipo}
                      </span>
                      <h3 className="font-semibold text-gray-800 mt-1">{ev.titulo}</h3>
                    </div>
                    <Trophy className="w-5 h-5 text-gray-300" />
                  </div>
                  {ev.descricao && <p className="text-xs text-gray-500 mt-2">{ev.descricao}</p>}
                  <div className="mt-3 space-y-1 text-xs text-gray-500">
                    <p className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDateTime(ev.data)}</p>
                    <p>{ev.local}</p>
                    <p className="font-medium">
                      {ev.inscritos}/{ev.vagas > 0 ? ev.vagas : '--'} inscritos
                    </p>
                  </div>
                  <button
                    onClick={() => inscreverEvento(ev.id)}
                    disabled={lotado}
                    className={`mt-3 w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                      lotado ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {lotado ? 'Lotado' : 'Inscrever'}
                  </button>
                </div>
              )
            })}
            {eventos.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-400 text-sm">
                Nenhum evento ativo. Crie o primeiro!
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====== AVALIACOES TAB ====== */}
      {tab === 'avaliacoes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-700 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" /> Avaliacoes de Cordas
              </h2>
              {avaliacoes.length > 0 && (
                <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
                  Media geral: {renderStars(Math.round(mediaAvaliacoes))} <span className="font-medium">{mediaAvaliacoes}</span>
                </p>
              )}
            </div>
            <button
              onClick={() => setShowAvaliacaoForm(!showAvaliacaoForm)}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
            >
              <Plus className="w-4 h-4" /> Avaliar
            </button>
          </div>

          {showAvaliacaoForm && (
            <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-3">
              <h3 className="font-medium text-sm text-gray-700">Nova Avaliacao</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Cliente</label>
                  <select
                    value={avaliacaoForm.clienteId}
                    onChange={e => setAvaliacaoForm({ ...avaliacaoForm, clienteId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  >
                    <option value="">Selecione...</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Corda</label>
                  <select
                    value={avaliacaoForm.cordaId}
                    onChange={e => setAvaliacaoForm({ ...avaliacaoForm, cordaId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  >
                    <option value="">Selecione...</option>
                    {cordas.map(c => <option key={c.id} value={c.id}>{c.marca} - {c.nome}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Nota</label>
                {renderStars(avaliacaoForm.nota, true, n => setAvaliacaoForm({ ...avaliacaoForm, nota: n }))}
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Comentario</label>
                <textarea
                  value={avaliacaoForm.comentario}
                  onChange={e => setAvaliacaoForm({ ...avaliacaoForm, comentario: e.target.value })}
                  placeholder="O que achou da corda?"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm h-20 resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={salvarAvaliacao} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                  Salvar
                </button>
                <button onClick={() => setShowAvaliacaoForm(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200">
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {avaliacoes.map(a => (
              <div key={a.id} className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{a.cliente.nome}</p>
                    <p className="text-xs text-gray-500">{a.corda.marca} - {a.corda.nome}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {renderStars(a.nota)}
                    <span className="text-[10px] text-gray-400">{formatDateTime(a.createdAt)}</span>
                  </div>
                </div>
                {a.comentario && <p className="text-sm text-gray-600 mt-2">{a.comentario}</p>}
              </div>
            ))}
            {avaliacoes.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                Nenhuma avaliacao ainda. Seja o primeiro a avaliar!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
