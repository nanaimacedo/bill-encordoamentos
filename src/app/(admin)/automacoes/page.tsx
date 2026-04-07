'use client'

import { useEffect, useState } from 'react'
import { Bell, Settings, Play, Check, Calendar, AlertTriangle, Package, Filter } from 'lucide-react'

interface ConfigAutomacao {
  id: string
  diasLembreteTroca: number
  diasAvisoDebito: number
  msgLembreteTroca: string
  msgDebitoPendente: string
  msgPronto: string
  msgAniversario: string
  ativo: boolean
}

interface Notificacao {
  id: string
  clienteId: string
  tipo: string
  titulo: string
  mensagem: string
  lida: boolean
  enviada: boolean
  canal: string
  createdAt: string
  cliente: { id: string; nome: string; telefone: string }
}

interface Resultado {
  created: number
  lembretes: number
  debitos: number
  aniversarios: number
  message?: string
}

const TIPO_LABELS: Record<string, string> = {
  lembrete_troca: 'Lembrete',
  debito_pendente: 'Débito',
  encordoamento_pronto: 'Pronto',
  aniversario: 'Aniversário',
}

const TIPO_COLORS: Record<string, string> = {
  lembrete_troca: 'bg-yellow-100 text-yellow-800',
  debito_pendente: 'bg-red-100 text-red-800',
  encordoamento_pronto: 'bg-green-100 text-green-800',
  aniversario: 'bg-purple-100 text-purple-800',
}

const TIPO_ICONS: Record<string, React.ReactNode> = {
  lembrete_troca: <Bell className="w-3 h-3" />,
  debito_pendente: <AlertTriangle className="w-3 h-3" />,
  encordoamento_pronto: <Package className="w-3 h-3" />,
  aniversario: <Calendar className="w-3 h-3" />,
}

const TABS = [
  { key: 'todos', label: 'Todos' },
  { key: 'lembrete_troca', label: 'Lembretes' },
  { key: 'debito_pendente', label: 'Débitos' },
  { key: 'encordoamento_pronto', label: 'Prontos' },
  { key: 'aniversario', label: 'Aniversários' },
]

export default function AutomacoesPage() {
  const [config, setConfig] = useState<ConfigAutomacao | null>(null)
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [tab, setTab] = useState('todos')
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [loading, setLoading] = useState(true)
  const [executando, setExecutando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [showConfig, setShowConfig] = useState(false)

  const carregarConfig = async () => {
    const res = await fetch('/api/automacoes/config')
    const data = await res.json()
    setConfig(data)
  }

  const carregarNotificacoes = async () => {
    const res = await fetch('/api/notificacoes')
    const data = await res.json()
    setNotificacoes(Array.isArray(data) ? data.slice(0, 50) : [])
  }

  useEffect(() => {
    Promise.all([carregarConfig(), carregarNotificacoes()]).then(() => setLoading(false))
  }, [])

  const salvarConfig = async () => {
    if (!config) return
    setSalvando(true)
    await fetch('/api/automacoes/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })
    setSalvando(false)
  }

  const executar = async () => {
    setExecutando(true)
    setResultado(null)
    const res = await fetch('/api/automacoes/executar', { method: 'POST' })
    const data = await res.json()
    setResultado(data)
    setExecutando(false)
    carregarNotificacoes()
  }

  const marcarLida = async (id: string) => {
    await fetch(`/api/notificacoes/${id}`, { method: 'PUT' })
    setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n))
  }

  const filtradas = tab === 'todos'
    ? notificacoes
    : notificacoes.filter(n => n.tipo === tab)

  if (loading) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-6 h-6 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-800">Automações</h1>
        </div>
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">Configurações</span>
        </button>
      </div>

      {/* Config Section */}
      {showConfig && config && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 space-y-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Settings className="w-5 h-5 text-green-600" />
            Configurações de Automação
          </h2>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Automações ativas</label>
            <button
              onClick={() => setConfig({ ...config, ativo: !config.ativo })}
              className={`relative w-12 h-6 rounded-full transition-colors ${config.ativo ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${config.ativo ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dias para lembrete de troca
              </label>
              <input
                type="number"
                value={config.diasLembreteTroca}
                onChange={e => setConfig({ ...config, diasLembreteTroca: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dias para aviso de débito
              </label>
              <input
                type="number"
                value={config.diasAvisoDebito}
                onChange={e => setConfig({ ...config, diasAvisoDebito: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mensagem de lembrete de troca
              </label>
              <textarea
                value={config.msgLembreteTroca}
                onChange={e => setConfig({ ...config, msgLembreteTroca: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <p className="text-xs text-gray-400 mt-0.5">Variáveis: {'{nome}'}, {'{dias}'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mensagem de débito pendente
              </label>
              <textarea
                value={config.msgDebitoPendente}
                onChange={e => setConfig({ ...config, msgDebitoPendente: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <p className="text-xs text-gray-400 mt-0.5">Variáveis: {'{nome}'}, {'{valor}'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mensagem de encordoamento pronto
              </label>
              <textarea
                value={config.msgPronto}
                onChange={e => setConfig({ ...config, msgPronto: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <p className="text-xs text-gray-400 mt-0.5">Variáveis: {'{nome}'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mensagem de aniversário
              </label>
              <textarea
                value={config.msgAniversario}
                onChange={e => setConfig({ ...config, msgAniversario: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <p className="text-xs text-gray-400 mt-0.5">Variáveis: {'{nome}'}</p>
            </div>
          </div>

          <button
            onClick={salvarConfig}
            disabled={salvando}
            className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {salvando ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      )}

      {/* Execute Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Executar Automações</h2>
            <p className="text-sm text-gray-500">Verifica lembretes de troca, débitos pendentes e aniversários</p>
          </div>
          <button
            onClick={executar}
            disabled={executando}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {executando ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {executando ? 'Executando...' : 'Executar Agora'}
          </button>
        </div>

        {resultado && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-medium text-green-800 mb-2">
              {resultado.created > 0
                ? `${resultado.created} notificação(ões) criada(s)!`
                : 'Nenhuma notificação nova criada.'}
            </p>
            {resultado.created > 0 && (
              <div className="flex flex-wrap gap-3 text-xs text-green-700">
                {resultado.lembretes > 0 && <span>Lembretes: {resultado.lembretes}</span>}
                {resultado.debitos > 0 && <span>Débitos: {resultado.debitos}</span>}
                {resultado.aniversarios > 0 && <span>Aniversários: {resultado.aniversarios}</span>}
              </div>
            )}
            {resultado.message && (
              <p className="text-xs text-green-600 mt-1">{resultado.message}</p>
            )}
          </div>
        )}
      </div>

      {/* Notifications Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 md:p-6 pb-0 md:pb-0">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-800">Notificações Recentes</h2>
            <span className="text-xs text-gray-400">({filtradas.length})</span>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-2 -mb-px">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-t-lg whitespace-nowrap border-b-2 transition-colors ${
                  tab === t.key
                    ? 'border-green-600 text-green-700 bg-green-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-100">
          {filtradas.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              Nenhuma notificação encontrada
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filtradas.map(n => (
                <li key={n.id} className={`p-4 md:px-6 flex items-start gap-3 ${n.lida ? 'opacity-60' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${TIPO_COLORS[n.tipo] || 'bg-gray-100 text-gray-800'}`}>
                        {TIPO_ICONS[n.tipo]}
                        {TIPO_LABELS[n.tipo] || n.tipo}
                      </span>
                      <span className="text-sm font-medium text-gray-800 truncate">
                        {n.cliente?.nome}
                      </span>
                      {n.lida && (
                        <span className="text-xs text-green-600 flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> Lida
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{n.mensagem}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(n.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  {!n.lida && (
                    <button
                      onClick={() => marcarLida(n.id)}
                      className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
