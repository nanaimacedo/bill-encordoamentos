'use client'

import { useEffect, useState } from 'react'
import { Plus, Package, Edit2, Trash2, Search } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Corda {
  id: string
  nome: string
  marca: string
  tipo: string
  calibre: string
  preco: number
  descricao: string
  beneficios: string
  estoque: number
}

interface Produto {
  id: string
  nome: string
  categoria: string
  preco: number
  descricao: string
  beneficios: string
  estoque: number
}

type Tab = 'cordas' | 'produtos'

export default function ProdutosPage() {
  const [tab, setTab] = useState<Tab>('cordas')
  const [cordas, setCordas] = useState<Corda[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<Corda | Produto | null>(null)
  const [busca, setBusca] = useState('')
  const [formCorda, setFormCorda] = useState({
    nome: '', marca: '', tipo: 'monofilamento', calibre: '1.25', preco: 0, descricao: '', beneficios: '', estoque: 10
  })
  const [formProduto, setFormProduto] = useState({
    nome: '', categoria: 'grip', preco: 0, descricao: '', beneficios: '', estoque: 10
  })

  const carregarCordas = async () => {
    const res = await fetch('/api/cordas')
    setCordas(await res.json())
  }
  const carregarProdutos = async () => {
    const res = await fetch('/api/produtos')
    setProdutos(await res.json())
  }

  useEffect(() => {
    Promise.all([carregarCordas(), carregarProdutos()]).finally(() => setLoading(false))
  }, [])

  const salvarCorda = async () => {
    const isEdit = editando && 'marca' in editando
    await fetch(isEdit ? `/api/cordas/${editando.id}` : '/api/cordas', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formCorda),
    })
    setShowForm(false)
    setEditando(null)
    setFormCorda({ nome: '', marca: '', tipo: 'monofilamento', calibre: '1.25', preco: 0, descricao: '', beneficios: '', estoque: 10 })
    carregarCordas()
  }

  const salvarProduto = async () => {
    const isEdit = editando && 'categoria' in editando
    await fetch(isEdit ? `/api/produtos/${editando.id}` : '/api/produtos', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formProduto),
    })
    setShowForm(false)
    setEditando(null)
    setFormProduto({ nome: '', categoria: 'grip', preco: 0, descricao: '', beneficios: '', estoque: 10 })
    carregarProdutos()
  }

  const editarCorda = (c: Corda) => {
    setEditando(c)
    setFormCorda({ nome: c.nome, marca: c.marca, tipo: c.tipo, calibre: c.calibre, preco: c.preco, descricao: c.descricao, beneficios: c.beneficios, estoque: c.estoque })
    setTab('cordas')
    setShowForm(true)
  }

  const editarProduto = (p: Produto) => {
    setEditando(p)
    setFormProduto({ nome: p.nome, categoria: p.categoria, preco: p.preco, descricao: p.descricao, beneficios: p.beneficios, estoque: p.estoque })
    setTab('produtos')
    setShowForm(true)
  }

  const deletarCorda = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover esta corda?')) return
    await fetch(`/api/cordas/${id}`, { method: 'DELETE' })
    carregarCordas()
  }

  const deletarProduto = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover este produto?')) return
    await fetch(`/api/produtos/${id}`, { method: 'DELETE' })
    carregarProdutos()
  }

  const cordasFiltradas = cordas.filter(c => c.nome.toLowerCase().includes(busca.toLowerCase()) || c.marca.toLowerCase().includes(busca.toLowerCase()))
  const produtosFiltrados = produtos.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()) || p.categoria.toLowerCase().includes(busca.toLowerCase()))

  const tipoLabels: Record<string, string> = {
    monofilamento: 'Mono', multifilamento: 'Multi', natural: 'Natural', hibrida: 'Híbrida'
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Catálogo</h1>
        <button
          onClick={() => { setEditando(null); setFormCorda({ nome: '', marca: '', tipo: 'monofilamento', calibre: '1.25', preco: 0, descricao: '', beneficios: '', estoque: 10 }); setFormProduto({ nome: '', categoria: 'grip', preco: 0, descricao: '', beneficios: '', estoque: 10 }); setShowForm(true); }}
          className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
        >
          <Plus className="w-4 h-4" /> {tab === 'cordas' ? 'Nova Corda' : 'Novo Produto'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('cordas')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'cordas' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}
        >
          Cordas ({cordas.length})
        </button>
        <button
          onClick={() => setTab('produtos')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'produtos' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}
        >
          Produtos ({produtos.length})
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nome, marca ou categoria..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Cordas */}
      {tab === 'cordas' && (
        <div className="space-y-2">
          {cordasFiltradas.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">Nenhuma corda encontrada</p>}
          {cordasFiltradas.map(c => (
            <div key={c.id} className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-800">{c.nome}</span>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{tipoLabels[c.tipo] || c.tipo}</span>
                    {c.estoque < 5 && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Estoque baixo!</span>}
                  </div>
                  <p className="text-xs text-gray-500">{c.marca} - {c.calibre}mm</p>
                  {c.descricao && <p className="text-xs text-gray-400 mt-1">{c.descricao}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-bold text-green-600">{formatCurrency(c.preco)}</p>
                    <p className="text-xs text-gray-400">Estoque: {c.estoque}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button onClick={() => editarCorda(c)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600" title="Editar">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deletarCorda(c.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-600" title="Remover">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Produtos */}
      {tab === 'produtos' && (
        <div className="space-y-2">
          {produtosFiltrados.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">Nenhum produto encontrado</p>}
          {produtosFiltrados.map(p => (
            <div key={p.id} className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-800">{p.nome}</span>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full uppercase">{p.categoria}</span>
                    {p.estoque < 5 && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Estoque baixo!</span>}
                  </div>
                  {p.descricao && <p className="text-xs text-gray-400 mt-1">{p.descricao}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-bold text-green-600">{formatCurrency(p.preco)}</p>
                    <p className="text-xs text-gray-400">Estoque: {p.estoque}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button onClick={() => editarProduto(p)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600" title="Editar">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deletarProduto(p.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-600" title="Remover">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-3 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-800">
              {editando ? (tab === 'cordas' ? 'Editar Corda' : 'Editar Produto') : (tab === 'cordas' ? 'Nova Corda' : 'Novo Produto')}
            </h3>

            {tab === 'cordas' ? (
              <>
                <input placeholder="Nome *" value={formCorda.nome} onChange={e => setFormCorda(p => ({ ...p, nome: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                <input placeholder="Marca *" value={formCorda.marca} onChange={e => setFormCorda(p => ({ ...p, marca: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                <select value={formCorda.tipo} onChange={e => setFormCorda(p => ({ ...p, tipo: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-green-500">
                  <option value="monofilamento">Monofilamento</option>
                  <option value="multifilamento">Multifilamento</option>
                  <option value="natural">Natural</option>
                  <option value="hibrida">Híbrida</option>
                </select>
                <input placeholder="Calibre (ex: 1.25)" value={formCorda.calibre} onChange={e => setFormCorda(p => ({ ...p, calibre: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                <input type="number" placeholder="Preço" value={formCorda.preco || ''} onChange={e => setFormCorda(p => ({ ...p, preco: Number(e.target.value) }))} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                <textarea placeholder="Descrição" value={formCorda.descricao} onChange={e => setFormCorda(p => ({ ...p, descricao: e.target.value }))} rows={2} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-green-500 resize-none" />
                <textarea placeholder="Benefícios" value={formCorda.beneficios} onChange={e => setFormCorda(p => ({ ...p, beneficios: e.target.value }))} rows={2} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-green-500 resize-none" />
                <input type="number" placeholder="Estoque" value={formCorda.estoque} onChange={e => setFormCorda(p => ({ ...p, estoque: Number(e.target.value) }))} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-green-500" />
              </>
            ) : (
              <>
                <input placeholder="Nome *" value={formProduto.nome} onChange={e => setFormProduto(p => ({ ...p, nome: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                <select value={formProduto.categoria} onChange={e => setFormProduto(p => ({ ...p, categoria: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-green-500">
                  <option value="grip">Grip</option>
                  <option value="overgrip">Overgrip</option>
                  <option value="acessorio">Acessório</option>
                  <option value="raquete">Raquete</option>
                </select>
                <input type="number" placeholder="Preço" value={formProduto.preco || ''} onChange={e => setFormProduto(p => ({ ...p, preco: Number(e.target.value) }))} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                <textarea placeholder="Descrição" value={formProduto.descricao} onChange={e => setFormProduto(p => ({ ...p, descricao: e.target.value }))} rows={2} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-green-500 resize-none" />
                <input type="number" placeholder="Estoque" value={formProduto.estoque} onChange={e => setFormProduto(p => ({ ...p, estoque: Number(e.target.value) }))} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-green-500" />
              </>
            )}

            <div className="flex gap-2 pt-2">
              <button onClick={() => { setShowForm(false); setEditando(null); setFormCorda({ nome: '', marca: '', tipo: 'monofilamento', calibre: '1.25', preco: 0, descricao: '', beneficios: '', estoque: 10 }); setFormProduto({ nome: '', categoria: 'grip', preco: 0, descricao: '', beneficios: '', estoque: 10 }); }} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600">Cancelar</button>
              <button onClick={tab === 'cordas' ? salvarCorda : salvarProduto} className="flex-1 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
