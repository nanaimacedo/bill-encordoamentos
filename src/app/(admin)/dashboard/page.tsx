'use client'

import { useEffect, useState } from 'react'
import {
  BarChart3, DollarSign, TrendingUp, AlertCircle, Truck, Store, Users, AlertTriangle
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
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
  topClientes: { nome: string; telefone: string; faturamento: number; servicos: number }[]
  encordoamentosPorDia: { date: string; count: number }[]
  deliveryStats: { totalDelivery: number; totalRetirada: number }
  centroReceita: {
    loja: { faturamento: number; total: number }
    delivery: { faturamento: number; total: number }
  }
}

interface EstoqueAlerta {
  cordasBaixas: { id: string; nome: string; estoque: number }[]
  produtosBaixos: { id: string; nome: string; estoque: number }[]
  total: number
}

type Periodo = 'hoje' | 'semana' | 'mes' | 'ano' | 'consolidado'

const CHART_COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0']
const PIE_COLORS = ['#059669', '#F97316']

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [periodoFat, setPeriodoFat] = useState<Periodo>('mes')
  const [estoqueAlerta, setEstoqueAlerta] = useState<EstoqueAlerta | null>(null)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))

    fetch('/api/inteligencia/estoque-alerta')
      .then(res => res.json())
      .then(setEstoqueAlerta)
      .catch(console.error)
  }, [])

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <h1 className="text-2xl font-bold mb-6 font-heading">Dashboard</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm animate-pulse h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm animate-pulse h-72" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  const periodoLabels: Record<Periodo, string> = {
    hoje: 'Hoje', semana: 'Semana', mes: 'Mês', ano: 'Ano', consolidado: 'Total',
  }

  const chartData = data.encordoamentosPorDia.map(d => ({
    ...d,
    label: d.date.slice(5),
  }))

  const pieData = [
    { name: 'Loja', value: data.centroReceita.loja.faturamento || 1 },
    { name: 'Delivery', value: data.centroReceita.delivery.faturamento || 0 },
  ].filter(d => d.value > 0)

  const faturamentoBarData = [
    { periodo: 'Hoje', valor: data.faturamento.hoje },
    { periodo: 'Semana', valor: data.faturamento.semana },
    { periodo: 'Mês', valor: data.faturamento.mes },
    { periodo: 'Ano', valor: data.faturamento.ano },
  ]

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-heading">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Visao geral do seu negocio</p>
      </div>

      {/* Stock Alert Banner */}
      {estoqueAlerta && estoqueAlerta.total > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="font-semibold text-red-800 text-sm">{estoqueAlerta.total} {estoqueAlerta.total === 1 ? 'item' : 'itens'} com estoque baixo</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {estoqueAlerta.cordasBaixas.map(c => (
              <span key={c.id} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                {c.nome} ({c.estoque})
              </span>
            ))}
            {estoqueAlerta.produtosBaixos.map(p => (
              <span key={p.id} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                {p.nome} ({p.estoque})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-5 text-white shadow-lg shadow-emerald-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-white/20"><DollarSign className="w-5 h-5" /></div>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{periodoLabels[periodoFat]}</span>
          </div>
          <p className="text-emerald-100 text-xs mb-1">Faturamento</p>
          <p className="text-2xl font-bold font-heading">{formatCurrency(data.faturamento[periodoFat])}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="mb-3"><div className="p-2 rounded-xl bg-blue-50 w-fit"><BarChart3 className="w-5 h-5 text-blue-600" /></div></div>
          <p className="text-gray-500 text-xs mb-1">Encordoamentos</p>
          <p className="text-2xl font-bold text-gray-900 font-heading">{data.totalEncordoamentos}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="mb-3"><div className="p-2 rounded-xl bg-purple-50 w-fit"><TrendingUp className="w-5 h-5 text-purple-600" /></div></div>
          <p className="text-gray-500 text-xs mb-1">Ticket Médio</p>
          <p className="text-2xl font-bold text-gray-900 font-heading">{formatCurrency(data.ticketMedio.mes)}</p>
          <p className="text-xs text-gray-400 mt-1">Geral: {formatCurrency(data.ticketMedio.geral)}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="mb-3"><div className="p-2 rounded-xl bg-red-50 w-fit"><AlertCircle className="w-5 h-5 text-red-500" /></div></div>
          <p className="text-gray-500 text-xs mb-1">Em Aberto</p>
          <p className="text-2xl font-bold text-red-600 font-heading">{formatCurrency(data.totalEmAberto)}</p>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 max-w-md">
        {(Object.keys(periodoLabels) as Periodo[]).map(p => (
          <button key={p} onClick={() => setPeriodoFat(p)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
              periodoFat === p ? 'bg-white text-emerald-700 shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {periodoLabels[p]}
          </button>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-800 font-heading">Encordoamentos</h2>
            <p className="text-xs text-gray-400">Últimos 30 dias</p>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                  formatter={(value: unknown) => [String(value), 'Encordoamentos']} labelFormatter={(l) => `Data: ${l}`} />
                <Area type="monotone" dataKey="count" stroke="#059669" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-800 font-heading">Centro de Receita</h2>
            <p className="text-xs text-gray-400">Loja vs Delivery</p>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={4} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                  formatter={(value: unknown) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-600" />
              <div>
                <p className="text-xs text-gray-500">Loja</p>
                <p className="text-sm font-semibold">{formatCurrency(data.centroReceita.loja.faturamento)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <div>
                <p className="text-xs text-gray-500">Delivery</p>
                <p className="text-sm font-semibold">{formatCurrency(data.centroReceita.delivery.faturamento)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-800 font-heading">Faturamento por Período</h2>
            <p className="text-xs text-gray-400">Comparativo</p>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={faturamentoBarData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="periodo" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                  formatter={(value: unknown) => [formatCurrency(Number(value)), 'Faturamento']} />
                <Bar dataKey="valor" fill="#059669" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">Consolidado (total)</span>
            <span className="text-sm font-bold text-emerald-600">{formatCurrency(data.faturamento.consolidado)}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-800 font-heading">Cordas Mais Usadas</h2>
            <p className="text-xs text-gray-400">Top 5 por quantidade</p>
          </div>
          {data.topCordas.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Nenhum dado ainda</p>
          ) : (
            <div className="space-y-4">
              {data.topCordas.map((corda, i) => {
                const maxCount = Math.max(...data.topCordas.map(c => c.count))
                const pct = (corda.count / maxCount) * 100
                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 font-medium">{corda.nome}</span>
                      <span className="text-xs font-semibold text-emerald-600">{corda.count}x</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Ranking Clientes */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-gray-800 font-heading">Ranking de Clientes</h2>
          <p className="text-xs text-gray-400">Top 10 por faturamento</p>
        </div>
        {data.topClientes.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Nenhum dado ainda</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 pr-2 text-xs text-gray-400 font-medium w-8">#</th>
                  <th className="text-left py-2 text-xs text-gray-400 font-medium">Cliente</th>
                  <th className="text-center py-2 text-xs text-gray-400 font-medium">Serv.</th>
                  <th className="text-right py-2 text-xs text-gray-400 font-medium">Faturamento</th>
                </tr>
              </thead>
              <tbody>
                {data.topClientes.map((c, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0">
                    <td className="py-2.5 pr-2">
                      {i < 3 ? (
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                          i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-gray-400' : 'bg-amber-600'
                        }`}>{i + 1}</span>
                      ) : (
                        <span className="text-xs text-gray-400 pl-1.5">{i + 1}</span>
                      )}
                    </td>
                    <td className="py-2.5">
                      <p className="font-medium text-gray-800">{c.nome}</p>
                      <p className="text-xs text-gray-400">{c.telefone}</p>
                    </td>
                    <td className="py-2.5 text-center">
                      <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">{c.servicos}</span>
                    </td>
                    <td className="py-2.5 text-right font-semibold text-emerald-600">{formatCurrency(c.faturamento)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <Store className="w-5 h-5 text-emerald-600 mx-auto mb-2" />
          <p className="text-xs text-gray-500">Loja</p>
          <p className="text-lg font-bold text-gray-900 font-heading">{data.centroReceita.loja.total}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <Truck className="w-5 h-5 text-orange-500 mx-auto mb-2" />
          <p className="text-xs text-gray-500">Deliveries</p>
          <p className="text-lg font-bold text-gray-900 font-heading">{data.centroReceita.delivery.total}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <Users className="w-5 h-5 text-blue-500 mx-auto mb-2" />
          <p className="text-xs text-gray-500">Total Serviços</p>
          <p className="text-lg font-bold text-gray-900 font-heading">{data.totalEncordoamentos}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <TrendingUp className="w-5 h-5 text-purple-500 mx-auto mb-2" />
          <p className="text-xs text-gray-500">Ticket Geral</p>
          <p className="text-lg font-bold text-gray-900 font-heading">{formatCurrency(data.ticketMedio.geral)}</p>
        </div>
      </div>
    </div>
  )
}
