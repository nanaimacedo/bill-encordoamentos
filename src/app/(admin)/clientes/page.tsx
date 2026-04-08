'use client'

import { useEffect, useState } from 'react'
import { Search, Plus, ChevronRight, Trash2, X } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/Toast'

interface Cliente {
  id: string
  nome: string
  telefone: string
  condominio: string | null
  apartamento: string | null
  centroReceita: string | null
  _count?: { encordoamentos: number }
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [pagina, setPagina] = useState(1)
  const [form, setForm] = useState({ nome: '', telefone: '', condominio: '', apartamento: '', centroReceita: 'loja' })
  const [editandoCentro, setEditandoCentro] = useState<string | null>(null)
  const { toast } = useToast()

  const LOCAIS = ['Cooper', 'Leal', 'Vitallis', 'CPB', 'Lorian', 'Tenis Ranch', 'Delivery', 'Torneio', 'Loja']

  const excluirCliente = async (id: string, nome: string) => {
    if (!confirm(`Excluir ${nome}? Todas as vendas deste cliente serão removidas.`)) return
    try {
      const res = await fetch(`/api/clientes/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Falha')
      setClientes(prev => prev.filter(c => c.id !== id))
      toast({ title: `${nome} excluído`, type: 'success' })
    } catch {
      toast({ title: 'Erro ao excluir. Verifique se há vendas vinculadas.', type: 'error' })
    }
  }

  const alterarCentroCliente = async (id: string, centro: string) => {
    setClientes(prev => prev.map(c => c.id === id ? { ...c, centroReceita: centro } : c))
    setEditandoCentro(null)
    try {
      const res = await fetch(`/api/clientes/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ centroReceita: centro }),
      })
      if (!res.ok) throw new Error('Falha')
      toast({ title: `Centro → ${centro}`, type: 'success' })
    } catch { toast({ title: 'Erro ao alterar', type: 'error' }); carregar(busca) }
  }

  const carregar = async (q = '') => {
    setLoading(true)
    const res = await fetch(`/api/clientes?q=${encodeURIComponent(q)}`)
    const data = await res.json()
    setClientes(data)
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  useEffect(() => {
    const t = setTimeout(() => carregar(busca), 300)
    return () => clearTimeout(t)
  }, [busca])

  const salvar = async () => {
    if (!form.nome || !form.telefone) return
    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Falha ao salvar')
      toast({ title: 'Cliente cadastrado!', type: 'success' })
      setShowForm(false)
      setForm({ nome: '', telefone: '', condominio: '', apartamento: '', centroReceita: 'loja' })
      carregar(busca)
    } catch {
      toast({ title: 'Erro ao cadastrar cliente', type: 'error' })
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Clientes</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
        >
          <Plus className="w-4 h-4" /> Novo
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nome ou telefone..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm bg-white"
        />
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {['todos', 'cooper', 'leal', 'vitallis', 'cpb', 'lorian', 'tenis ranch', 'delivery', 'torneio'].map(f => (
          <button
            key={f}
            onClick={() => { setFiltroTipo(f); setPagina(1) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filtroTipo === f
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'todos' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse h-16" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {(() => {
            const filtrados = filtroTipo === 'todos'
              ? clientes
              : clientes.filter(c => c.centroReceita === filtroTipo)
            const total = filtrados.length
            const inicio = (pagina - 1) * 20
            const fim = Math.min(inicio + 20, total)
            const paginados = filtrados.slice(inicio, fim)
            const totalPaginas = Math.ceil(total / 20)

            return (
              <>
                {total === 0 && (
                  <p className="text-center text-gray-400 py-8 text-sm">Nenhum cliente encontrado</p>
                )}
                {paginados.map(c => (
                  <div key={c.id} className="bg-white rounded-xl p-4 border border-gray-100 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <Link href={`/clientes/${c.id}`} className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 text-sm truncate">{c.nome}</p>
                        <p className="text-xs text-gray-500">{c.telefone || 'Sem tel'}</p>
                        {c.condominio && <p className="text-xs text-gray-400">{c.condominio} {c.apartamento && `- Apt ${c.apartamento}`}</p>}
                      </Link>
                      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        {c._count && <span className="text-xs text-gray-400">{c._count.encordoamentos} vendas</span>}
                        <button onClick={() => excluirCliente(c.id, c.nome)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors" title="Excluir">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {/* Centro de receita editável */}
                    <div className="mt-2 flex items-center gap-1.5">
                      {editandoCentro === c.id ? (
                        <div className="flex flex-wrap gap-1">
                          {LOCAIS.map(l => (
                            <button key={l} onClick={() => alterarCentroCliente(c.id, l.toLowerCase())}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${
                                c.centroReceita === l.toLowerCase()
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                              }`}>{l}</button>
                          ))}
                          <button onClick={() => setEditandoCentro(null)} className="text-gray-400 ml-0.5"><X className="w-3 h-3" /></button>
                        </div>
                      ) : (
                        <button onClick={() => setEditandoCentro(c.id)}
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            c.centroReceita === 'delivery' ? 'bg-orange-50 text-orange-600' :
                            c.centroReceita === 'torneio' ? 'bg-purple-50 text-purple-600' :
                            c.centroReceita === 'cooper' ? 'bg-teal-50 text-teal-600' :
                            'bg-emerald-50 text-emerald-600'
                          }`}>
                          {c.centroReceita ? c.centroReceita.charAt(0).toUpperCase() + c.centroReceita.slice(1) : 'Loja'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {total > 0 && (
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-gray-500">
                      Mostrando {inicio + 1}-{fim} de {total}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPagina(p => Math.max(1, p - 1))}
                        disabled={pagina === 1}
                        className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50"
                      >
                        Anterior
                      </button>
                      <button
                        onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                        disabled={pagina >= totalPaginas}
                        className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50"
                      >
                        Próximo
                      </button>
                    </div>
                  </div>
                )}
              </>
            )
          })()}
        </div>
      )}

      {/* Modal novo cliente */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Novo Cliente</h3>
            <input
              placeholder="Nome *"
              value={form.nome}
              onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-green-500"
            />
            <input
              placeholder="Telefone *"
              value={form.telefone}
              onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-green-500"
            />
            <input
              placeholder="Condomínio"
              value={form.condominio}
              onChange={e => setForm(p => ({ ...p, condominio: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-green-500"
            />
            <input
              placeholder="Apartamento"
              value={form.apartamento}
              onChange={e => setForm(p => ({ ...p, apartamento: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-green-500"
            />
            <div>
              <p className="text-xs text-gray-500 mb-1.5">Local</p>
              <div className="flex flex-wrap gap-1.5">
                {['Cooper', 'Leal', 'Vitallis', 'CPB', 'Lorian', 'Tenis Ranch', 'Delivery', 'Torneio'].map(local => (
                  <button key={local} type="button"
                    onClick={() => setForm(p => ({ ...p, centroReceita: local.toLowerCase() }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                      form.centroReceita === local.toLowerCase()
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {local}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={salvar}
                className="flex-1 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700"
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
