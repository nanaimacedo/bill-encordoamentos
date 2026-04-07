'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import { Search, RotateCcw, Check, Plus, Truck, Package } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'

interface Cliente {
  id: string
  nome: string
  telefone: string
  condominio: string | null
  apartamento: string | null
}

interface Corda {
  id: string
  nome: string
  marca: string
  tipo: string
  preco: number
}

interface LastEncordoamento {
  cordaId: string
  tensao: number
  tensaoCross: number | null
  tipo: string
  preco: number
  corda: { nome: string; marca: string }
}

const TENSOES = [48, 50, 52, 54, 55, 56, 57, 58, 60, 62]

export default function NovoEncordoamentoPageWrapper() {
  return (
    <Suspense fallback={<div className="p-4 text-center text-gray-400">Carregando...</div>}>
      <NovoEncordoamentoPage />
    </Suspense>
  )
}

function NovoEncordoamentoPage() {
  const searchParams = useSearchParams()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [cordas, setCordas] = useState<Corda[]>([])
  const [busca, setBusca] = useState('')
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [cordaSelecionada, setCordaSelecionada] = useState<string>('')
  const [tensao, setTensao] = useState<number>(55)
  const [preco, setPreco] = useState<number>(0)
  const [observacoes, setObservacoes] = useState('')
  const [entrega, setEntrega] = useState<'retirada' | 'delivery'>('retirada')
  const [enderecoEntrega, setEnderecoEntrega] = useState('')
  const [taxaDelivery, setTaxaDelivery] = useState<number>(10)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [lastEnc, setLastEnc] = useState<LastEncordoamento | null>(null)
  const [showNovoCliente, setShowNovoCliente] = useState(false)
  const [novoCliente, setNovoCliente] = useState({ nome: '', telefone: '', condominio: '', apartamento: '' })

  // Auto-selecionar cliente via query param (vindo do scanner QR)
  useEffect(() => {
    const clienteId = searchParams.get('clienteId')
    if (clienteId) {
      fetch(`/api/clientes/${clienteId}`)
        .then(r => r.json())
        .then(c => {
          if (c && c.id) {
            setClienteSelecionado(c)
            setBusca(c.nome)
          }
        })
        .catch(() => {})
    }
  }, [searchParams])

  // Buscar clientes
  const buscarClientes = useCallback(async (q: string) => {
    if (q.length < 1) { setClientes([]); return }
    const res = await fetch(`/api/clientes?q=${encodeURIComponent(q)}`)
    const data = await res.json()
    setClientes(data)
  }, [])

  // Buscar cordas
  useEffect(() => {
    fetch('/api/cordas').then(r => r.json()).then(setCordas)
  }, [])

  // Debounce busca
  useEffect(() => {
    const t = setTimeout(() => buscarClientes(busca), 200)
    return () => clearTimeout(t)
  }, [busca, buscarClientes])

  // Buscar último encordoamento quando selecionar cliente
  useEffect(() => {
    if (!clienteSelecionado) { setLastEnc(null); return }
    fetch(`/api/encordoamentos/repetir/${clienteSelecionado.id}`)
      .then(r => r.json())
      .then(data => {
        if (data && data.id) setLastEnc(data)
        else setLastEnc(null)
      })
      .catch(() => setLastEnc(null))

    // Auto-preencher endereço de delivery com condomínio do cliente
    if (clienteSelecionado.condominio) {
      setEnderecoEntrega(
        `${clienteSelecionado.condominio}${clienteSelecionado.apartamento ? ` - Apt ${clienteSelecionado.apartamento}` : ''}`
      )
    }
  }, [clienteSelecionado])

  // Update preco when corda changes
  useEffect(() => {
    const corda = cordas.find(c => c.id === cordaSelecionada)
    if (corda) setPreco(corda.preco)
  }, [cordaSelecionada, cordas])

  const repetirUltimo = () => {
    if (!lastEnc) return
    setCordaSelecionada(lastEnc.cordaId)
    setTensao(lastEnc.tensao)
    setPreco(lastEnc.preco)
  }

  const precoTotal = entrega === 'delivery' ? preco + taxaDelivery : preco

  const salvar = async () => {
    if (!clienteSelecionado || !cordaSelecionada) return
    setSalvando(true)
    try {
      const res = await fetch('/api/encordoamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId: clienteSelecionado.id,
          cordaId: cordaSelecionada,
          tensao,
          preco: precoTotal,
          observacoes,
          tipo: 'padrao',
          entrega,
          enderecoEntrega: entrega === 'delivery' ? enderecoEntrega : '',
          taxaDelivery: entrega === 'delivery' ? taxaDelivery : 0,
        }),
      })
      if (res.ok) {
        setSucesso(true)
        setTimeout(() => {
          setSucesso(false)
          setClienteSelecionado(null)
          setCordaSelecionada('')
          setTensao(55)
          setPreco(0)
          setObservacoes('')
          setEntrega('retirada')
          setEnderecoEntrega('')
          setBusca('')
          setLastEnc(null)
        }, 1500)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSalvando(false)
    }
  }

  const criarCliente = async () => {
    if (!novoCliente.nome || !novoCliente.telefone) return
    const res = await fetch('/api/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novoCliente),
    })
    if (res.ok) {
      const cliente = await res.json()
      setClienteSelecionado(cliente)
      setShowNovoCliente(false)
      setNovoCliente({ nome: '', telefone: '', condominio: '', apartamento: '' })
      setBusca(cliente.nome)
    }
  }

  if (sucesso) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Encordoamento Registrado!</h2>
          <p className="text-sm text-gray-500 mt-1">
            {entrega === 'delivery' ? 'Delivery programado' : 'Aguardando retirada'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-800">Novo Encordoamento</h1>

      {/* Step 1: Selecionar cliente */}
      {!clienteSelecionado ? (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar cliente por nome ou telefone..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
              autoFocus
            />
          </div>

          {clientes.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 divide-y max-h-60 overflow-y-auto">
              {clientes.map(c => (
                <button
                  key={c.id}
                  onClick={() => { setClienteSelecionado(c); setBusca(c.nome) }}
                  className="w-full text-left px-4 py-3 hover:bg-green-50 transition-colors"
                >
                  <p className="font-medium text-sm text-gray-800">{c.nome}</p>
                  <p className="text-xs text-gray-500">{c.telefone}</p>
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => setShowNovoCliente(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-green-500 hover:text-green-600 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" /> Novo Cliente
          </button>

          {showNovoCliente && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
                <h3 className="text-lg font-bold text-gray-800">Novo Cliente</h3>
                <input placeholder="Nome *" value={novoCliente.nome} onChange={e => setNovoCliente(p => ({ ...p, nome: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                <input placeholder="Telefone *" value={novoCliente.telefone} onChange={e => setNovoCliente(p => ({ ...p, telefone: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                <input placeholder="Condomínio" value={novoCliente.condominio} onChange={e => setNovoCliente(p => ({ ...p, condominio: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                <input placeholder="Apartamento" value={novoCliente.apartamento} onChange={e => setNovoCliente(p => ({ ...p, apartamento: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                <div className="flex gap-2">
                  <button onClick={() => setShowNovoCliente(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600">Cancelar</button>
                  <button onClick={criarCliente} className="flex-1 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700">Salvar</button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Cliente selecionado */}
          <div className="bg-green-50 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm text-gray-800">{clienteSelecionado.nome}</p>
              <p className="text-xs text-gray-500">{clienteSelecionado.telefone}</p>
            </div>
            <button
              onClick={() => { setClienteSelecionado(null); setBusca(''); setLastEnc(null) }}
              className="text-xs text-green-700 underline"
            >
              Trocar
            </button>
          </div>

          {/* Repetir último */}
          {lastEnc && (
            <button
              onClick={repetirUltimo}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-50 text-blue-700 font-medium text-sm hover:bg-blue-100 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Repetir último: {lastEnc.corda.nome} - {lastEnc.tensao}lbs
            </button>
          )}

          {/* Step 2: Selecionar corda */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Corda</label>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
              {cordas.map(c => (
                <button
                  key={c.id}
                  onClick={() => setCordaSelecionada(c.id)}
                  className={`text-left px-4 py-3 rounded-xl border-2 transition-all text-sm ${
                    cordaSelecionada === c.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium text-gray-800">{c.nome}</span>
                      <span className="text-gray-400 ml-1">- {c.marca}</span>
                    </div>
                    <span className="text-green-600 font-semibold">{formatCurrency(c.preco)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Tensão */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Tensão: {tensao} lbs
            </label>
            <div className="grid grid-cols-5 gap-2">
              {TENSOES.map(t => (
                <button
                  key={t}
                  onClick={() => setTensao(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    tensao === t
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={tensao}
              onChange={e => setTensao(Number(e.target.value))}
              placeholder="Tensão personalizada"
              className="w-full px-4 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Step 4: Entrega (Retirada ou Delivery) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Entrega</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setEntrega('retirada')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  entrega === 'retirada'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <Package className="w-4 h-4" /> Retirada
              </button>
              <button
                onClick={() => setEntrega('delivery')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  entrega === 'delivery'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <Truck className="w-4 h-4" /> Delivery
              </button>
            </div>

            {entrega === 'delivery' && (
              <div className="space-y-2 bg-blue-50 rounded-xl p-3">
                <input
                  type="text"
                  value={enderecoEntrega}
                  onChange={e => setEnderecoEntrega(e.target.value)}
                  placeholder="Endereço de entrega..."
                  className="w-full px-4 py-2 rounded-lg border border-blue-200 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
                <div className="flex items-center gap-2">
                  <label className="text-xs text-blue-600">Taxa delivery:</label>
                  <input
                    type="number"
                    step="0.01"
                    value={taxaDelivery}
                    onChange={e => setTaxaDelivery(Number(e.target.value))}
                    className="w-28 px-3 py-1.5 rounded-lg border border-blue-200 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Step 5: Preço */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Preço do Serviço</label>
            <input
              type="number"
              step="0.01"
              value={preco}
              onChange={e => setPreco(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-green-500 text-lg font-bold"
            />
            {entrega === 'delivery' && (
              <div className="flex justify-between text-sm text-gray-600 px-1">
                <span>Serviço: {formatCurrency(preco)}</span>
                <span>Delivery: +{formatCurrency(taxaDelivery)}</span>
                <span className="font-bold text-gray-800">Total: {formatCurrency(precoTotal)}</span>
              </div>
            )}
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Observações</label>
            <textarea
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              placeholder="Opcional..."
              rows={2}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>

          {/* Botão salvar */}
          <button
            onClick={salvar}
            disabled={!cordaSelecionada || salvando}
            className="w-full py-4 rounded-xl bg-green-600 text-white font-bold text-base hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {salvando ? 'Salvando...' : `Registrar ${entrega === 'delivery' ? '+ Delivery' : ''} - ${formatCurrency(precoTotal)}`}
          </button>
        </>
      )}
    </div>
  )
}
