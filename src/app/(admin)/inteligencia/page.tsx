'use client'

import { useEffect, useState } from 'react'
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertTriangle,
  UserMinus,
  BarChart3,
  Star,
  Minus,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

type Tab = 'recomendacoes' | 'demanda' | 'sazonalidade' | 'churn'

interface Cliente {
  id: string
  nome: string
  telefone: string
}

interface Recomendacao {
  corda: { id: string; nome: string; marca: string; tipo: string; calibre: string; preco: number }
  motivo: string
  mediaAvaliacoes: number
  totalAvaliacoes: number
}

interface DemandaCorda {
  id: string
  nome: string
  marca: string
  tipo: string
  uso30d: number
  uso60d: number
  uso90d: number
  tendencia: 'subindo' | 'descendo' | 'estavel'
  estoque: number
  diasRestantes: number
  alertaEstoque: boolean
}

interface MesSazonalidade {
  mes: string
  total: number
}

interface ClienteChurn {
  cliente: { id: string; nome: string; telefone: string }
  ultimoEncordoamento: string
  diasSemVoltar: number
  frequenciaMedia: number
  totalEncordoamentos: number
}

export default function InteligenciaPage() {
  const [tab, setTab] = useState<Tab>('recomendacoes')

  const tabs = [
    { id: 'recomendacoes' as Tab, label: 'Recomendações', icon: Brain },
    { id: 'demanda' as Tab, label: 'Demanda', icon: TrendingUp },
    { id: 'sazonalidade' as Tab, label: 'Sazonalidade', icon: Calendar },
    { id: 'churn' as Tab, label: 'Churn', icon: UserMinus },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Brain className="w-7 h-7 text-purple-600" />
        <h1 className="text-2xl font-bold text-foreground">Inteligência & Analytics</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto bg-white rounded-xl border border-border p-1">
        {tabs.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                tab === t.id
                  ? 'bg-purple-50 text-purple-700'
                  : 'text-foreground-muted hover:bg-background-secondary'
              }`}
            >
              <Icon size={16} />
              {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'recomendacoes' && <TabRecomendacoes />}
      {tab === 'demanda' && <TabDemanda />}
      {tab === 'sazonalidade' && <TabSazonalidade />}
      {tab === 'churn' && <TabChurn />}
    </div>
  )
}

// ============ TAB RECOMENDAÇÕES ============

function TabRecomendacoes() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteId, setClienteId] = useState('')
  const [recomendacoes, setRecomendacoes] = useState<Recomendacao[]>([])
  const [perfilResumo, setPerfilResumo] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/clientes')
      .then((r) => r.json())
      .then(setClientes)
  }, [])

  const buscar = async (id: string) => {
    setClienteId(id)
    if (!id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/inteligencia/recomendacao/${id}`)
      const data = await res.json()
      setRecomendacoes(data.recomendacoes || [])
      setPerfilResumo(data.perfilResumo || '')
    } catch {
      setRecomendacoes([])
    }
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-border p-4">
        <label className="block text-sm font-medium text-foreground-muted mb-2">
          Selecione o cliente
        </label>
        <select
          value={clienteId}
          onChange={(e) => buscar(e.target.value)}
          className="w-full md:w-80 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">-- Escolher cliente --</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>

      {clienteId && perfilResumo && (
        <div className="bg-purple-50 rounded-xl border border-purple-200 p-4">
          <p className="text-sm text-purple-700 font-medium">{perfilResumo}</p>
        </div>
      )}

      {loading && (
        <p className="text-sm text-foreground-muted">Analisando perfil...</p>
      )}

      {!loading && recomendacoes.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {recomendacoes.map((rec) => (
            <div
              key={rec.corda?.id || rec.motivo}
              className="bg-white rounded-xl border border-border p-4 space-y-3"
            >
              <div>
                <h3 className="font-semibold text-foreground">{rec.corda?.nome || 'Corda'}</h3>
                <p className="text-xs text-foreground-muted">
                  {rec.corda?.marca || ''} &middot; {rec.corda?.tipo || ''} &middot; {rec.corda?.calibre || ''}
                </p>
              </div>

              <p className="text-sm text-foreground-muted">{rec.motivo}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={14}
                      className={
                        s <= Math.round(rec.mediaAvaliacoes)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }
                    />
                  ))}
                  <span className="text-xs text-foreground-muted ml-1">
                    {rec.mediaAvaliacoes > 0
                      ? `${rec.mediaAvaliacoes} (${rec.totalAvaliacoes})`
                      : 'Sem avaliações'}
                  </span>
                </div>
                <span className="text-sm font-semibold text-green-600">
                  R$ {rec.corda?.preco?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && clienteId && recomendacoes.length === 0 && (
        <p className="text-sm text-foreground-muted">
          Nenhuma recomendação disponível.
        </p>
      )}
    </div>
  )
}

// ============ TAB DEMANDA ============

function TabDemanda() {
  const [cordas, setCordas] = useState<DemandaCorda[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/inteligencia/demanda')
      .then((r) => r.json())
      .then((data) => {
        setCordas(data.cordas || [])
        setLoading(false)
      })
  }, [])

  if (loading) return <p className="text-sm text-foreground-muted">Carregando demanda...</p>

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-border">
              <th className="text-left px-4 py-3 font-medium text-foreground-muted">Corda</th>
              <th className="text-center px-3 py-3 font-medium text-foreground-muted">30d</th>
              <th className="text-center px-3 py-3 font-medium text-foreground-muted">60d</th>
              <th className="text-center px-3 py-3 font-medium text-foreground-muted">90d</th>
              <th className="text-center px-3 py-3 font-medium text-foreground-muted">Tendência</th>
              <th className="text-center px-3 py-3 font-medium text-foreground-muted">Estoque</th>
              <th className="text-center px-3 py-3 font-medium text-foreground-muted">Dias Rest.</th>
            </tr>
          </thead>
          <tbody>
            {cordas.map((c) => (
              <tr
                key={c.id}
                className={`border-b border-border last:border-0 ${
                  c.alertaEstoque ? 'bg-red-50' : ''
                }`}
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{c.nome}</div>
                  <div className="text-xs text-foreground-muted">{c.marca} &middot; {c.tipo}</div>
                </td>
                <td className="text-center px-3 py-3 font-mono">{c.uso30d}</td>
                <td className="text-center px-3 py-3 font-mono">{c.uso60d}</td>
                <td className="text-center px-3 py-3 font-mono">{c.uso90d}</td>
                <td className="text-center px-3 py-3">
                  {c.tendencia === 'subindo' && (
                    <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                      <TrendingUp size={14} /> Subindo
                    </span>
                  )}
                  {c.tendencia === 'descendo' && (
                    <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                      <TrendingDown size={14} /> Descendo
                    </span>
                  )}
                  {c.tendencia === 'estavel' && (
                    <span className="inline-flex items-center gap-1 text-gray-500 font-medium">
                      <Minus size={14} /> Estável
                    </span>
                  )}
                </td>
                <td className="text-center px-3 py-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      c.alertaEstoque
                        ? 'bg-red-100 text-red-700'
                        : c.estoque > 10
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {c.estoque}
                  </span>
                </td>
                <td className="text-center px-3 py-3">
                  {c.diasRestantes >= 999 ? (
                    <span className="text-green-600 text-xs font-medium">Sem uso</span>
                  ) : c.alertaEstoque ? (
                    <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                      <AlertTriangle size={12} /> {c.diasRestantes}d
                    </span>
                  ) : (
                    <span className="text-foreground">{c.diasRestantes}d</span>
                  )}
                </td>
              </tr>
            ))}
            {cordas.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-foreground-muted">
                  Nenhuma corda cadastrada
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ============ TAB SAZONALIDADE ============

function TabSazonalidade() {
  const [meses, setMeses] = useState<MesSazonalidade[]>([])
  const [melhorMes, setMelhorMes] = useState('')
  const [piorMes, setPiorMes] = useState('')
  const [totalEnc, setTotalEnc] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/inteligencia/sazonalidade')
      .then((r) => r.json())
      .then((data) => {
        setMeses(data.meses || [])
        setMelhorMes(data.melhorMes || '')
        setPiorMes(data.piorMes || '')
        setTotalEnc(data.totalEncordoamentos || 0)
        setLoading(false)
      })
  }, [])

  if (loading) return <p className="text-sm text-foreground-muted">Carregando sazonalidade...</p>

  const maxTotal = Math.max(...meses.map((m) => m.total), 1)

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-border p-4 text-center">
          <p className="text-xs text-foreground-muted mb-1">Total geral</p>
          <p className="text-2xl font-bold text-foreground">{totalEnc}</p>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-200 p-4 text-center">
          <p className="text-xs text-green-600 mb-1">Melhor mês</p>
          <p className="text-2xl font-bold text-green-700">{melhorMes}</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 p-4 text-center">
          <p className="text-xs text-red-600 mb-1">Pior mês</p>
          <p className="text-2xl font-bold text-red-700">{piorMes}</p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="bg-white rounded-xl border border-border p-4">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={18} className="text-purple-600" />
          <h3 className="font-semibold text-foreground">Encordoamentos por mês</h3>
        </div>

        <div className="flex items-end gap-2 h-48">
          {meses.map((m) => {
            const height = maxTotal > 0 ? (m.total / maxTotal) * 100 : 0
            const isMelhor = m.mes === melhorMes
            const isPior = m.mes === piorMes

            return (
              <div key={m.mes} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-medium text-foreground-muted">{m.total}</span>
                <div
                  className={`w-full rounded-t-md transition-all ${
                    isMelhor
                      ? 'bg-green-500'
                      : isPior
                        ? 'bg-red-400'
                        : 'bg-purple-400'
                  }`}
                  style={{ height: `${Math.max(height, 2)}%` }}
                />
                <span
                  className={`text-[10px] font-medium ${
                    isMelhor
                      ? 'text-green-700'
                      : isPior
                        ? 'text-red-600'
                        : 'text-foreground-muted'
                  }`}
                >
                  {m.mes}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ============ TAB CHURN ============

function TabChurn() {
  const [emRisco, setEmRisco] = useState<ClienteChurn[]>([])
  const [totalEmRisco, setTotalEmRisco] = useState(0)
  const [totalAtivos, setTotalAtivos] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/inteligencia/churn')
      .then((r) => r.json())
      .then((data) => {
        setEmRisco(data.emRisco || [])
        setTotalEmRisco(data.totalEmRisco || 0)
        setTotalAtivos(data.totalAtivos || 0)
        setLoading(false)
      })
  }, [])

  if (loading) return <p className="text-sm text-foreground-muted">Analisando churn...</p>

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-red-50 rounded-xl border border-red-200 p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <UserMinus size={16} className="text-red-600" />
            <p className="text-xs text-red-600">Em risco</p>
          </div>
          <p className="text-3xl font-bold text-red-700">{totalEmRisco}</p>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-200 p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <p className="text-xs text-green-600">Ativos</p>
          </div>
          <p className="text-3xl font-bold text-green-700">{totalAtivos}</p>
        </div>
      </div>

      {/* At-risk list */}
      {emRisco.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-8 text-center text-foreground-muted">
          Nenhum cliente em risco de churn
        </div>
      ) : (
        <div className="space-y-2">
          {emRisco.map((item) => {
            const isHigh = item.diasSemVoltar > 90

            return (
              <div
                key={item.cliente?.id || item.diasSemVoltar}
                className="bg-white rounded-xl border border-border p-4 flex flex-col md:flex-row md:items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground">{item.cliente?.nome || 'Cliente'}</h3>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        isHigh
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {isHigh ? 'Alto risco' : 'Médio risco'}
                    </span>
                  </div>
                  <p className="text-xs text-foreground-muted mt-0.5">{item.cliente?.telefone || ''}</p>
                </div>

                <div className="flex flex-wrap gap-4 text-xs">
                  <div className="text-center">
                    <p className="text-foreground-muted">Sem voltar</p>
                    <p className="font-bold text-foreground">{item.diasSemVoltar} dias</p>
                  </div>
                  <div className="text-center">
                    <p className="text-foreground-muted">Freq. média</p>
                    <p className="font-bold text-foreground">{item.frequenciaMedia}d</p>
                  </div>
                  <div className="text-center">
                    <p className="text-foreground-muted">Total serviços</p>
                    <p className="font-bold text-foreground">{item.totalEncordoamentos}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-foreground-muted">Última visita</p>
                    <p className="font-bold text-foreground">
                      {formatDate(item.ultimoEncordoamento)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
