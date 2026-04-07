'use client'

import { useEffect, useState } from 'react'
import { BarChart3, DollarSign, TrendingUp, AlertCircle, Truck, Package, Store } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface DashboardData {
  totalEncordoamentos: number
  faturamento: {
    hoje: number
    semana: number
    mes: number
    ano: number
    consolidado: number
  }
  ticketMedio: {
    mes: number
    geral: number
  }
  totalEmAberto: number
  topCordas: { nome: string; count: number }[]
  encordoamentosPorDia: { date: string; count: number }[]
  deliveryStats: {
    totalDelivery: number
    totalRetirada: number
  }
  centroReceita: {
    loja: { faturamento: number; total: number }
    delivery: { faturamento: number; total: number }
  }
}

type Periodo = 'hoje' | 'semana' | 'mes' | 'ano' | 'consolidado'

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [periodoFat, setPeriodoFat] = useState<Periodo>('mes')

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm animate-pulse h-28" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  const periodoLabels: Record<Periodo, string> = {
    hoje: 'Hoje',
    semana: 'Semana',
    mes: 'Mês',
    ano: 'Ano',
    consolidado: 'Total',
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

      {/* Cards principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-green-50">
              <BarChart3 className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-1">Encordoamentos</p>
          <p className="text-lg font-bold text-gray-800">{data.totalEncordoamentos}</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-red-50">
              <AlertCircle className="w-4 h-4 text-red-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-1">Em Aberto</p>
          <p className="text-lg font-bold text-red-600">{formatCurrency(data.totalEmAberto)}</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-purple-50">
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-1">Ticket Médio (Mês)</p>
          <p className="text-lg font-bold text-gray-800">{formatCurrency(data.ticketMedio.mes)}</p>
          <p className="text-xs text-gray-400">Geral: {formatCurrency(data.ticketMedio.geral)}</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-blue-50">
              <Store className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-1">Receita por Centro</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Loja</span>
              <span className="text-sm font-bold text-gray-800">
                {data.centroReceita?.loja.total ?? data.deliveryStats.totalRetirada} ({formatCurrency(data.centroReceita?.loja.faturamento ?? 0)})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Delivery</span>
              <span className="text-sm font-bold text-gray-800">
                {data.centroReceita?.delivery.total ?? data.deliveryStats.totalDelivery} ({formatCurrency(data.centroReceita?.delivery.faturamento ?? 0)})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Faturamento por período */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <DollarSign className="w-4 h-4" /> Faturamento
          </h2>
        </div>

        {/* Period tabs */}
        <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 overflow-x-auto">
          {(Object.keys(periodoLabels) as Periodo[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriodoFat(p)}
              className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                periodoFat === p
                  ? 'bg-white text-green-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {periodoLabels[p]}
            </button>
          ))}
        </div>

        {/* Selected period value */}
        <div className="text-center py-4">
          <p className="text-3xl font-bold text-green-600">
            {formatCurrency(data.faturamento[periodoFat])}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {periodoFat === 'consolidado' ? 'Faturamento total acumulado' : `Faturamento ${periodoLabels[periodoFat].toLowerCase()}`}
          </p>
        </div>

        {/* All periods summary */}
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 mt-2 pt-3 border-t border-gray-100">
          {(Object.keys(periodoLabels) as Periodo[]).map(p => (
            <div key={p} className="text-center">
              <p className="text-xs text-gray-400 uppercase">{periodoLabels[p]}</p>
              <p className={`text-xs font-semibold ${p === periodoFat ? 'text-green-600' : 'text-gray-700'}`}>
                {formatCurrency(data.faturamento[p])}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Chart - Últimos 30 dias */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Encordoamentos - Últimos 30 dias</h2>
        <div className="flex items-end gap-1 h-32 overflow-x-auto">
          {data.encordoamentosPorDia.map((day, i) => {
            const maxCount = Math.max(...data.encordoamentosPorDia.map(d => d.count), 1)
            const height = (day.count / maxCount) * 100
            return (
              <div
                key={i}
                className="flex-1 bg-green-500 rounded-t-sm min-w-[4px] hover:bg-green-600 transition-colors relative group"
                style={{ height: `${Math.max(height, 2)}%` }}
                title={`${day.date}: ${day.count}`}
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
                  {day.count}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Top Cordas */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Cordas Mais Usadas</h2>
        <div className="space-y-2">
          {data.topCordas.length === 0 && (
            <p className="text-sm text-gray-400">Nenhum dado ainda</p>
          )}
          {data.topCordas.map((corda, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 w-5">{i + 1}.</span>
                <span className="text-sm text-gray-700">{corda.nome}</span>
              </div>
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                {corda.count}x
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
