'use client'

import { useEffect, useState, useCallback } from 'react'
import { Wallet, Search, X, Plus, Minus, History, User, TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react'
import { formatCurrency, formatDateTime, formatDate } from '@/lib/utils'
import { useToast } from '@/components/Toast'

interface ClienteContaCorrente {
  cliente: { id: string; nome: string; telefone: string }
  saldo: number
  divida: number
  saldoLiquido: number
  pendentes: number
}

interface Resumo {
  totalClientes: number
  totalCredito: number
  totalDivida: number
  saldoLiquido: number
}

interface Movimentacao {
  id: string
  tipo: string
  valor: number
  descricao: string
  createdAt: string
}

interface PendenteDetalhe {
  id: string
  valor: number
  createdAt: string
  descricao: string
}

interface Extrato {
  cliente: { id: string; nome: string; telefone: string; saldoContaCorrente: number }
  saldo: number
  divida: number
  saldoLiquido: number
  movimentacoes: Movimentacao[]
  pendentes: PendenteDetalhe[]
}

interface ClienteSimples {
  id: string
  nome: string
  telefone: string
}

export default function ContaCorrentePage() {
  const [clientes, setClientes] = useState<ClienteContaCorrente[]>([])
  const [resumo, setResumo] = useState<Resumo>({ totalClientes: 0, totalCredito: 0, totalDivida: 0, saldoLiquido: 0 })
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<'todos' | 'credito' | 'devedores'>('todos')
  const [extrato, setExtrato] = useState<Extrato | null>(null)
  const [abrindoNova, setAbrindoNova] = useState(false)
  const [formNova, setFormNova] = useState({
    clienteId: '',
    clienteNome: '',
    tipo: 'credito' as 'credito' | 'debito',
    valor: '',
    descricao: '',
    abaterPagamentoIds: [] as string[],
  })
  const [buscaCliente, setBuscaCliente] = useState('')
  const [resultadoBusca, setResultadoBusca] = useState<ClienteSimples[]>([])
  const [pendentesDoCliente, setPendentesDoCliente] = useState<PendenteDetalhe[]>([])
  const { toast } = useToast()

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/conta-corrente')
      const data = await res.json()
      setClientes(data.clientes || [])
      setResumo(data.resumo || { totalClientes: 0, totalCredito: 0, totalDivida: 0, saldoLiquido: 0 })
    } catch {
      toast({ title: 'Erro ao carregar conta corrente', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { carregar() }, [carregar])

  // Busca de clientes no modal de nova movimentação
  useEffect(() => {
    if (!abrindoNova) return
    const t = setTimeout(async () => {
      if (!buscaCliente.trim()) {
        setResultadoBusca([])
        return
      }
      try {
        const res = await fetch(`/api/clientes?q=${encodeURIComponent(buscaCliente)}`)
        const data = await res.json()
        const lista = Array.isArray(data) ? data : data.clientes || []
        setResultadoBusca(lista.slice(0, 8))
      } catch {
        setResultadoBusca([])
      }
    }, 250)
    return () => clearTimeout(t)
  }, [buscaCliente, abrindoNova])

  const selecionarClienteForm = async (c: ClienteSimples) => {
    setFormNova(p => ({ ...p, clienteId: c.id, clienteNome: c.nome, abaterPagamentoIds: [] }))
    setBuscaCliente('')
    setResultadoBusca([])
    // Carrega pendentes do cliente
    try {
      const res = await fetch(`/api/conta-corrente/${c.id}`)
      const data = await res.json()
      setPendentesDoCliente(data.pendentes || [])
    } catch {
      setPendentesDoCliente([])
    }
  }

  const abrirNovaMovimentacao = () => {
    setAbrindoNova(true)
    setFormNova({ clienteId: '', clienteNome: '', tipo: 'credito', valor: '', descricao: '', abaterPagamentoIds: [] })
    setBuscaCliente('')
    setResultadoBusca([])
    setPendentesDoCliente([])
  }

  const togglePagamentoAbater = (id: string) => {
    setFormNova(p => ({
      ...p,
      abaterPagamentoIds: p.abaterPagamentoIds.includes(id)
        ? p.abaterPagamentoIds.filter(x => x !== id)
        : [...p.abaterPagamentoIds, id],
    }))
  }

  const salvarMovimentacao = async () => {
    if (!formNova.clienteId || !formNova.valor) {
      toast({ title: 'Selecione um cliente e informe o valor', type: 'error' })
      return
    }
    const valor = parseFloat(formNova.valor.replace(',', '.'))
    if (isNaN(valor) || valor <= 0) {
      toast({ title: 'Valor inválido', type: 'error' })
      return
    }
    try {
      const res = await fetch('/api/conta-corrente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId: formNova.clienteId,
          tipo: formNova.tipo,
          valor,
          descricao: formNova.descricao,
          abaterPagamentoIds: formNova.tipo === 'credito' ? formNova.abaterPagamentoIds : undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro')
      }
      const data = await res.json()
      toast({
        title:
          data.pagamentosAbatidos?.length > 0
            ? `${data.pagamentosAbatidos.length} pagamento(s) quitado(s)!`
            : 'Movimentação registrada!',
        type: 'success',
      })
      setAbrindoNova(false)
      carregar()
    } catch (err) {
      toast({ title: (err as Error).message || 'Erro ao salvar', type: 'error' })
    }
  }

  const abrirExtrato = async (clienteId: string) => {
    try {
      const res = await fetch(`/api/conta-corrente/${clienteId}`)
      const data = await res.json()
      setExtrato(data)
    } catch {
      toast({ title: 'Erro ao carregar extrato', type: 'error' })
    }
  }

  // Filtros + busca
  const buscaNorm = busca.trim().toLowerCase()
  const clientesFiltrados = clientes.filter(c => {
    if (buscaNorm && !c.cliente.nome.toLowerCase().includes(buscaNorm)) return false
    if (filtro === 'credito') return c.saldo > 0
    if (filtro === 'devedores') return c.divida > 0
    return true
  })

  const saldoColor = (valor: number) =>
    valor > 0 ? 'text-emerald-600' : valor < 0 ? 'text-red-600' : 'text-gray-400'

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-emerald-600" /> Conta Corrente
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Créditos e débitos por cliente</p>
        </div>
        <button
          onClick={abrirNovaMovimentacao}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4" /> Nova
        </button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
          <p className="text-xs text-emerald-600 uppercase font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Crédito
          </p>
          <p className="text-xl font-bold text-emerald-700">{formatCurrency(resumo.totalCredito)}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-3 border border-red-100">
          <p className="text-xs text-red-600 uppercase font-semibold flex items-center gap-1">
            <TrendingDown className="w-3 h-3" /> Devido
          </p>
          <p className="text-xl font-bold text-red-700">{formatCurrency(resumo.totalDivida)}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
          <p className="text-xs text-gray-600 uppercase font-semibold">Saldo Líq.</p>
          <p className={`text-xl font-bold ${saldoColor(resumo.saldoLiquido)}`}>
            {formatCurrency(resumo.saldoLiquido)}
          </p>
        </div>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por nome..."
          className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-200 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
        {busca && (
          <button
            onClick={() => setBusca('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-100"
          >
            <X className="w-3.5 h-3.5 text-gray-400" />
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto">
        {[
          { value: 'todos', label: 'Todos', count: clientes.length },
          { value: 'credito', label: 'Com crédito', count: clientes.filter(c => c.saldo > 0).length },
          { value: 'devedores', label: 'Devedores', count: clientes.filter(c => c.divida > 0).length },
        ].map(f => (
          <button key={f.value} onClick={() => setFiltro(f.value as typeof filtro)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              filtro === f.value ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-xl p-4 animate-pulse h-20" />)}
        </div>
      ) : clientesFiltrados.length === 0 ? (
        <div className="text-center py-12">
          <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Nenhum cliente na conta corrente</p>
        </div>
      ) : (
        <div className="space-y-2">
          {clientesFiltrados.map(c => (
            <button
              key={c.cliente.id}
              onClick={() => abrirExtrato(c.cliente.id)}
              className="w-full text-left bg-white rounded-xl p-4 border border-gray-100 hover:border-emerald-200 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-gray-800 truncate">{c.cliente.nome}</p>
                    <p className="text-xs text-gray-400 truncate">{c.cliente.telefone}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className={`text-lg font-bold ${saldoColor(c.saldoLiquido)}`}>
                    {formatCurrency(c.saldoLiquido)}
                  </p>
                  <div className="flex gap-2 text-[10px] text-gray-400 justify-end">
                    {c.saldo > 0 && <span className="text-emerald-600">+{formatCurrency(c.saldo)}</span>}
                    {c.divida > 0 && <span className="text-red-500">−{formatCurrency(c.divida)}</span>}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Modal Nova Movimentação */}
      {abrindoNova && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="text-base font-bold text-gray-900">Nova movimentação</h3>
              <button onClick={() => setAbrindoNova(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto flex-1">
              {/* Cliente */}
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Cliente</label>
                {formNova.clienteId ? (
                  <div className="mt-1 flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                    <span className="text-sm font-medium text-emerald-800">{formNova.clienteNome}</span>
                    <button
                      onClick={() => {
                        setFormNova(p => ({ ...p, clienteId: '', clienteNome: '', abaterPagamentoIds: [] }))
                        setPendentesDoCliente([])
                      }}
                      className="text-xs text-emerald-600 hover:underline"
                    >
                      Trocar
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative mt-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        value={buscaCliente}
                        onChange={e => setBuscaCliente(e.target.value)}
                        placeholder="Buscar cliente..."
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    {resultadoBusca.length > 0 && (
                      <div className="mt-1 border border-gray-200 rounded-lg max-h-44 overflow-y-auto">
                        {resultadoBusca.map(c => (
                          <button
                            key={c.id}
                            onClick={() => selecionarClienteForm(c)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                          >
                            <p className="text-sm font-medium text-gray-800">{c.nome}</p>
                            <p className="text-xs text-gray-400">{c.telefone}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Tipo */}
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Tipo</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    onClick={() => setFormNova(p => ({ ...p, tipo: 'credito' }))}
                    className={`py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 ${
                      formNova.tipo === 'credito'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <Plus className="w-4 h-4" /> Crédito
                  </button>
                  <button
                    onClick={() => setFormNova(p => ({ ...p, tipo: 'debito', abaterPagamentoIds: [] }))}
                    className={`py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 ${
                      formNova.tipo === 'debito'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <Minus className="w-4 h-4" /> Débito
                  </button>
                </div>
              </div>

              {/* Valor */}
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Valor (R$)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={formNova.valor}
                  onChange={e => setFormNova(p => ({ ...p, valor: e.target.value }))}
                  placeholder="0,00"
                  className="w-full mt-1 px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Descrição (opcional)</label>
                <input
                  type="text"
                  value={formNova.descricao}
                  onChange={e => setFormNova(p => ({ ...p, descricao: e.target.value }))}
                  placeholder="Ex: Pagamento via PIX"
                  className="w-full mt-1 px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Abater pagamentos pendentes (só se tipo=credito e tiver pendentes) */}
              {formNova.tipo === 'credito' && pendentesDoCliente.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Abater pagamentos pendentes
                  </label>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Selecione os débitos que serão quitados automaticamente com o crédito
                  </p>
                  <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                    {pendentesDoCliente.map(p => {
                      const selecionado = formNova.abaterPagamentoIds.includes(p.id)
                      return (
                        <button
                          key={p.id}
                          onClick={() => togglePagamentoAbater(p.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left ${
                            selecionado
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="text-xs text-gray-700 truncate">{p.descricao}</p>
                            <p className="text-[10px] text-gray-400">{formatDate(p.createdAt)}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                            <span className="text-xs font-bold text-red-600">{formatCurrency(p.valor)}</span>
                            {selecionado && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 p-4 border-t border-gray-100 flex-shrink-0">
              <button
                onClick={() => setAbrindoNova(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-600 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={salvarMovimentacao}
                className="flex-1 py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Extrato */}
      {extrato && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-gray-900 truncate">{extrato.cliente.nome}</h3>
                <p className="text-xs text-gray-500 mt-0.5">Extrato da conta corrente</p>
              </div>
              <button onClick={() => setExtrato(null)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Resumo rápido */}
            <div className="grid grid-cols-3 gap-2 p-4 flex-shrink-0">
              <div className="bg-emerald-50 rounded-lg p-2 text-center">
                <p className="text-[10px] text-emerald-600 uppercase font-semibold">Crédito</p>
                <p className="text-sm font-bold text-emerald-700">{formatCurrency(extrato.saldo)}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-2 text-center">
                <p className="text-[10px] text-red-600 uppercase font-semibold">Devido</p>
                <p className="text-sm font-bold text-red-700">{formatCurrency(extrato.divida)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-[10px] text-gray-500 uppercase font-semibold">Saldo</p>
                <p className={`text-sm font-bold ${saldoColor(extrato.saldoLiquido)}`}>
                  {formatCurrency(extrato.saldoLiquido)}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {/* Pendentes */}
              {extrato.pendentes.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Pendentes</h4>
                  <div className="space-y-1">
                    {extrato.pendentes.map(p => (
                      <div key={p.id} className="flex items-center justify-between bg-red-50/50 border border-red-100 rounded-lg px-3 py-2">
                        <div className="min-w-0">
                          <p className="text-xs text-gray-700 truncate">{p.descricao}</p>
                          <p className="text-[10px] text-gray-400">{formatDate(p.createdAt)}</p>
                        </div>
                        <span className="text-xs font-bold text-red-600 flex-shrink-0 ml-2">
                          {formatCurrency(p.valor)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Movimentações */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
                  <History className="w-3 h-3" /> Movimentações
                </h4>
                {extrato.movimentacoes.length === 0 ? (
                  <p className="text-center text-gray-400 text-xs py-6">Nenhuma movimentação ainda</p>
                ) : (
                  <div className="space-y-1">
                    {extrato.movimentacoes.map(m => (
                      <div key={m.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-700 truncate">{m.descricao}</p>
                          <p className="text-[10px] text-gray-400">{formatDateTime(m.createdAt)}</p>
                        </div>
                        <span
                          className={`text-xs font-bold flex-shrink-0 ml-2 ${
                            m.tipo === 'credito' ? 'text-emerald-600' : 'text-red-600'
                          }`}
                        >
                          {m.tipo === 'credito' ? '+' : '−'}
                          {formatCurrency(m.valor)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
