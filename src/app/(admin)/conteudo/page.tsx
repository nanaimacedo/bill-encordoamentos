'use client'

import { useEffect, useState } from 'react'
import { BookOpen, Plus, ChevronDown, ChevronUp } from 'lucide-react'

interface Conteudo {
  id: string
  titulo: string
  categoria: string
  conteudo: string
  resumo: string
  createdAt: string
}

const CATEGORIAS = [
  { id: 'todas', nome: 'Todas' },
  { id: 'cordas', nome: 'Cordas' },
  { id: 'tensoes', nome: 'Tensões' },
  { id: 'dicas', nome: 'Dicas de Jogo' },
]

export default function ConteudoPage() {
  const [conteudos, setConteudos] = useState<Conteudo[]>([])
  const [categoria, setCategoria] = useState('todas')
  const [loading, setLoading] = useState(true)
  const [expandido, setExpandido] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ titulo: '', categoria: 'cordas', conteudo: '', resumo: '' })

  const carregar = async () => {
    const params = categoria !== 'todas' ? `?categoria=${categoria}` : ''
    const res = await fetch(`/api/conteudo${params}`)
    setConteudos(await res.json())
    setLoading(false)
  }

  useEffect(() => { carregar() }, [categoria])

  const salvar = async () => {
    if (!form.titulo || !form.conteudo) return
    await fetch('/api/conteudo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setShowForm(false)
    setForm({ titulo: '', categoria: 'cordas', conteudo: '', resumo: '' })
    carregar()
  }

  const catLabels: Record<string, string> = {
    cordas: 'Cordas',
    tensoes: 'Tensões',
    dicas: 'Dicas',
  }

  const catColors: Record<string, string> = {
    cordas: 'bg-blue-100 text-blue-700',
    tensoes: 'bg-purple-100 text-purple-700',
    dicas: 'bg-orange-100 text-orange-700',
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Conteúdo Educativo</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
        >
          <Plus className="w-4 h-4" /> Novo
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto">
        {CATEGORIAS.map(c => (
          <button
            key={c.id}
            onClick={() => setCategoria(c.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              categoria === c.id ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {c.nome}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-xl p-4 animate-pulse h-20" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {conteudos.length === 0 && (
            <p className="text-center text-gray-400 py-8 text-sm">Nenhum conteúdo cadastrado</p>
          )}
          {conteudos.map(c => (
            <div key={c.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <button
                onClick={() => setExpandido(expandido === c.id ? null : c.id)}
                className="w-full text-left p-4 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catColors[c.categoria] || 'bg-gray-100 text-gray-600'}`}>
                      {catLabels[c.categoria] || c.categoria}
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-800 text-sm">{c.titulo}</h3>
                  {c.resumo && <p className="text-xs text-gray-500 mt-1">{c.resumo}</p>}
                </div>
                {expandido === c.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              {expandido === c.id && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">{c.conteudo}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-3 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-800">Novo Conteúdo</h3>
            <input placeholder="Título *" value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-green-500" />
            <select value={form.categoria} onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-green-500">
              <option value="cordas">Cordas</option>
              <option value="tensoes">Tensões</option>
              <option value="dicas">Dicas de Jogo</option>
            </select>
            <input placeholder="Resumo" value={form.resumo} onChange={e => setForm(p => ({ ...p, resumo: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-green-500" />
            <textarea placeholder="Conteúdo completo *" value={form.conteudo} onChange={e => setForm(p => ({ ...p, conteudo: e.target.value }))} rows={6} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-green-500 resize-none" />
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600">Cancelar</button>
              <button onClick={salvar} className="flex-1 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700">Publicar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
