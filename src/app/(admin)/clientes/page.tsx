'use client'

import { useEffect, useState } from 'react'
import { Search, Plus, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface Cliente {
  id: string
  nome: string
  telefone: string
  condominio: string | null
  apartamento: string | null
  _count?: { encordoamentos: number }
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nome: '', telefone: '', condominio: '', apartamento: '', centroReceita: 'loja' })

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
    const res = await fetch('/api/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setShowForm(false)
      setForm({ nome: '', telefone: '', condominio: '', apartamento: '', centroReceita: 'loja' })
      carregar(busca)
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

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse h-16" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {clientes.length === 0 && (
            <p className="text-center text-gray-400 py-8 text-sm">Nenhum cliente encontrado</p>
          )}
          {clientes.map(c => (
            <Link
              key={c.id}
              href={`/clientes/${c.id}`}
              className="bg-white rounded-xl p-4 flex items-center justify-between hover:bg-gray-50 transition-colors border border-gray-100 block"
            >
              <div>
                <p className="font-medium text-gray-800 text-sm">{c.nome}</p>
                <p className="text-xs text-gray-500">{c.telefone}</p>
                {c.condominio && (
                  <p className="text-xs text-gray-400">{c.condominio} {c.apartamento && `- Apt ${c.apartamento}`}</p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>
          ))}
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
            <select
              value={form.centroReceita || 'loja'}
              onChange={e => setForm(p => ({ ...p, centroReceita: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="loja">Loja (Clube)</option>
              <option value="delivery">Delivery</option>
            </select>
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
