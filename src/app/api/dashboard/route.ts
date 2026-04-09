import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dayOfWeek = now.getDay() // 0=Sun
    const startOfWeek = new Date(startOfToday)
    startOfWeek.setDate(startOfToday.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)) // Monday
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const trintaDiasAtras = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Total encordoamentos (all time)
    const totalEncordoamentos = await prisma.encordoamento.count()

    // Contagens por período
    const [totalEncordoamentosMes, vendasHoje, vendasSemana, vendasMes] = await Promise.all([
      prisma.encordoamento.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.encordoamento.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.encordoamento.count({ where: { createdAt: { gte: startOfWeek } } }),
      prisma.encordoamento.count({ where: { createdAt: { gte: startOfMonth } } }),
    ])

    // Clientes novos este mês
    const clientesNovosMes = await prisma.cliente.count({
      where: { createdAt: { gte: startOfMonth } },
    })

    // Total de clientes
    const totalClientes = await prisma.cliente.count()

    // Faturamento - pagamentos pagos por periodo
    const [fatHoje, fatSemana, fatMes, fatAno, fatConsolidado] = await Promise.all([
      prisma.pagamento.aggregate({
        where: { status: 'pago', dataPagamento: { gte: startOfToday } },
        _sum: { valor: true },
      }),
      prisma.pagamento.aggregate({
        where: { status: 'pago', dataPagamento: { gte: startOfWeek } },
        _sum: { valor: true },
      }),
      prisma.pagamento.aggregate({
        where: { status: 'pago', dataPagamento: { gte: startOfMonth } },
        _sum: { valor: true },
      }),
      prisma.pagamento.aggregate({
        where: { status: 'pago', dataPagamento: { gte: startOfYear } },
        _sum: { valor: true },
      }),
      prisma.pagamento.aggregate({
        where: { status: 'pago' },
        _sum: { valor: true },
      }),
    ])

    const faturamento = {
      hoje: Number(fatHoje._sum.valor || 0),
      semana: Number(fatSemana._sum.valor || 0),
      mes: Number(fatMes._sum.valor || 0),
      ano: Number(fatAno._sum.valor || 0),
      consolidado: Number(fatConsolidado._sum.valor || 0),
    }

    // Ticket medio
    const ticketMedio = {
      mes: totalEncordoamentosMes > 0
        ? Math.round((faturamento.mes / totalEncordoamentosMes) * 100) / 100
        : 0,
      geral: totalEncordoamentos > 0
        ? Math.round((faturamento.consolidado / totalEncordoamentos) * 100) / 100
        : 0,
    }

    // Total em aberto
    const totalEmAbertoAgg = await prisma.pagamento.aggregate({
      where: { status: 'pendente' },
      _sum: { valor: true },
    })
    const totalEmAberto = Number(totalEmAbertoAgg._sum.valor || 0)

    // Contagem de pagamentos pendentes
    const totalPagamentosPendentes = await prisma.pagamento.count({
      where: { status: 'pendente' },
    })

    // Top cordas (mais usadas, top 5)
    const topCordas = await prisma.encordoamento.groupBy({
      by: ['cordaId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    })

    const topCordasComNome = await Promise.all(
      topCordas.filter(item => item.cordaId).map(async (item) => {
        const corda = await prisma.corda.findUnique({
          where: { id: item.cordaId! },
          select: { nome: true },
        })
        return {
          nome: corda?.nome || 'Desconhecida',
          count: item._count.id,
        }
      })
    )

    // Encordoamentos por dia (ultimos 30 dias) — com faturamento
    const encordoamentosUltimos30 = await prisma.encordoamento.findMany({
      where: { createdAt: { gte: trintaDiasAtras } },
      select: { createdAt: true, preco: true },
      orderBy: { createdAt: 'asc' },
    })

    const encordoamentosPorDiaMap: Record<string, { count: number; receita: number }> = {}
    for (let i = 0; i < 30; i++) {
      const dia = new Date(trintaDiasAtras.getTime() + i * 24 * 60 * 60 * 1000)
      const chave = dia.toISOString().split('T')[0]
      encordoamentosPorDiaMap[chave] = { count: 0, receita: 0 }
    }

    encordoamentosUltimos30.forEach((enc) => {
      const chave = enc.createdAt.toISOString().split('T')[0]
      if (encordoamentosPorDiaMap[chave] !== undefined) {
        encordoamentosPorDiaMap[chave].count++
        encordoamentosPorDiaMap[chave].receita += enc.preco
      }
    })

    const encordoamentosPorDia = Object.entries(encordoamentosPorDiaMap).map(
      ([date, data]) => ({ date, count: data.count, receita: data.receita })
    )

    // Delivery stats
    const [totalDelivery, totalRetirada] = await Promise.all([
      prisma.encordoamento.count({ where: { entrega: 'delivery' } }),
      prisma.encordoamento.count({ where: { entrega: 'retirada' } }),
    ])

    // Faturamento por centro de receita (delivery vs todos os outros = loja)
    const [fatDelivery, fatTotal] = await Promise.all([
      prisma.pagamento.aggregate({
        where: {
          status: 'pago',
          encordoamento: { centroReceita: 'delivery' },
        },
        _sum: { valor: true },
      }),
      prisma.pagamento.aggregate({
        where: { status: 'pago' },
        _sum: { valor: true },
      }),
    ])
    const fatDeliveryVal = Number(fatDelivery._sum.valor || 0)
    const fatTotalVal = Number(fatTotal._sum.valor || 0)
    const fatLojaVal = fatTotalVal - fatDeliveryVal

    // Top clientes (ranking por faturamento)
    const topClientesData = await prisma.pagamento.groupBy({
      by: ['clienteId'],
      where: { status: 'pago' },
      _sum: { valor: true },
      _count: { id: true },
      orderBy: { _sum: { valor: 'desc' } },
      take: 10,
    })

    const topClientes = await Promise.all(
      topClientesData.map(async (item) => {
        const cliente = await prisma.cliente.findUnique({
          where: { id: item.clienteId },
          select: { nome: true, telefone: true },
        })
        return {
          nome: cliente?.nome || 'Desconhecido',
          telefone: cliente?.telefone || '',
          faturamento: Number(item._sum.valor || 0),
          servicos: item._count.id,
        }
      })
    )

    return Response.json({
      totalEncordoamentos,
      vendasHoje,
      vendasSemana,
      vendasMes,
      clientesNovosMes,
      totalClientes,
      totalPagamentosPendentes,
      faturamento,
      ticketMedio,
      totalEmAberto,
      topCordas: topCordasComNome,
      topClientes,
      encordoamentosPorDia,
      deliveryStats: {
        totalDelivery,
        totalRetirada,
      },
      centroReceita: {
        loja: { faturamento: fatLojaVal, total: totalRetirada },
        delivery: { faturamento: fatDeliveryVal, total: totalDelivery },
      },
    })
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error)
    return Response.json({ error: 'Erro ao buscar dados do dashboard' }, { status: 500 })
  }
}
