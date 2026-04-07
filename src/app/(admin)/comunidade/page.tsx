'use client'

import { useEffect, useState, useRef } from 'react'
import { Send, Hash, Users, MessageCircle } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

interface Mensagem {
  id: string
  autor: string
  conteudo: string
  canal: string
  createdAt: string
}

const CANAIS = [
  { id: 'geral', nome: 'Geral', icon: Hash },
  { id: 'loja', nome: 'Chat com Loja', icon: MessageCircle },
  { id: 'iniciante', nome: 'Iniciantes', icon: Users },
  { id: 'intermediario', nome: 'Intermediários', icon: Users },
  { id: 'avancado', nome: 'Avançados', icon: Users },
  { id: 'jogos', nome: 'Matchmaking', icon: Users },
]

export default function ComunidadePage() {
  const [canal, setCanal] = useState('geral')
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [texto, setTexto] = useState('')
  const [autor, setAutor] = useState('Loja')
  const [loading, setLoading] = useState(true)
  const messagesEnd = useRef<HTMLDivElement>(null)

  const carregar = async () => {
    const res = await fetch(`/api/mensagens?canal=${canal}`)
    setMensagens(await res.json())
    setLoading(false)
  }

  useEffect(() => { carregar() }, [canal])
  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, [mensagens])

  const enviar = async () => {
    if (!texto.trim()) return
    await fetch('/api/mensagens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ autor, conteudo: texto, canal }),
    })
    setTexto('')
    carregar()
  }

  const canalAtual = CANAIS.find(c => c.id === canal)!

  return (
    <div className="flex flex-col md:flex-row h-[calc(100dvh-5rem)] md:h-[calc(100dvh-2rem)]">
      {/* Sidebar canais - desktop */}
      <div className="hidden md:flex flex-col w-56 bg-white border-r border-gray-100 p-3 space-y-1">
        <h2 className="text-xs font-semibold text-gray-400 uppercase px-3 py-2">Canais</h2>
        {CANAIS.map(c => (
          <button
            key={c.id}
            onClick={() => setCanal(c.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              canal === c.id ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <c.icon className="w-4 h-4" /> {c.nome}
          </button>
        ))}
      </div>

      {/* Mobile canal selector */}
      <div className="md:hidden flex gap-2 p-3 overflow-x-auto bg-white border-b border-gray-100">
        {CANAIS.map(c => (
          <button
            key={c.id}
            onClick={() => setCanal(c.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium ${
              canal === c.id ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {c.nome}
          </button>
        ))}
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 bg-white border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
            <canalAtual.icon className="w-4 h-4" /> {canalAtual.nome}
          </h2>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-lg p-3 animate-pulse h-12" />)}
            </div>
          ) : mensagens.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">Nenhuma mensagem ainda. Comece a conversa!</p>
          ) : (
            mensagens.map(m => (
              <div key={m.id} className={`flex ${m.autor === 'Loja' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  m.autor === 'Loja'
                    ? 'bg-green-600 text-white rounded-br-sm'
                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
                }`}>
                  <p className={`text-[10px] font-medium mb-0.5 ${m.autor === 'Loja' ? 'text-green-100' : 'text-green-600'}`}>
                    {m.autor}
                  </p>
                  <p className="text-sm">{m.conteudo}</p>
                  <p className={`text-[10px] mt-1 ${m.autor === 'Loja' ? 'text-green-200' : 'text-gray-400'}`}>
                    {formatDateTime(m.createdAt)}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEnd} />
        </div>

        {/* Input */}
        <div className="p-3 bg-white border-t border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <label className="text-xs text-gray-500">Autor:</label>
            <input
              value={autor}
              onChange={e => setAutor(e.target.value)}
              className="px-2 py-1 rounded border border-gray-200 text-xs outline-none w-full sm:w-32"
            />
          </div>
          <div className="flex gap-2">
            <input
              value={texto}
              onChange={e => setTexto(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && enviar()}
              placeholder="Digite sua mensagem..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={enviar}
              className="px-4 py-2.5 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
