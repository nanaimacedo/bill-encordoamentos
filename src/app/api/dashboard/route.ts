import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Timezone Brasil (UTC-3): calcular "hoje" no horário local do Brasil
    const TZ_OFFSET_MS = 3 * 60 * 60 * 1000 // UTC-3
    const nowBR = new Date(Date.now() - TZ_OFFSET_MS) // agora em "horário Brasil"
    // Meia-noite Brasil = meia-noite BR convertida de volta para UTC (adiciona 3h)
    const startOfTodayBR = new Date(Date.UTC(nowBR.getUTCFullYear(), nowBR.getUTCMonth(), nowBR.getUTCDate()))
    const startOfToday = new Date(startOfTodayBR.getTime() + TZ_OFFSET_MS)
    const dayOfWeek = nowBR.getUTCDay() // 0=Sun
    const startOfWeek = new Date(startOfToday.getTime() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) * 24 * 60 * 60 * 1000)
    const startOfMonth = new Date(Date.UTC(nowBR.getUTCFullYear(), nowBR.getUTCMonth(), 1) + TZ_OFFSET_MS)
    const startOfYear = new Date(Date.UTC(nowBR.getUTCFullYear(), 0, 1) + TZ_OFFSET_MS)
    const now = new Date()
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

    // Faturamento — regime de competência: reconhece a receita na DATA DA VENDA
    // (encordoamento.createdAt / pedido.createdAt), não na data do pagamento.
    // Inclui vendas pendentes, exclui canceladas. Assim, confirmar o recebimento
    // de uma venda antiga não "move" aquele valor para o faturamento de hoje.
    const naoCancelado = { status: { not: 'cancelado' } }
    const [
      fatEncHoje, fatEncSemana, fatEncMes, fatEncAno, fatEncTotal,
      fatPedHoje, fatPedSemana, fatPedMes, fatPedAno, fatPedTotal,
    ] = await Promise.all([
      prisma.encordoamento.aggregate({ where: { createdAt: { gte: startOfToday }, ...naoCancelado }, _sum: { preco: true } }),
      prisma.encordoamento.aggregate({ where: { createdAt: { gte: startOfWeek }, ...naoCancelado }, _sum: { preco: true } }),
      prisma.encordoamento.aggregate({ where: { createdAt: { gte: startOfMonth }, ...naoCancelado }, _sum: { preco: true } }),
      prisma.encordoamento.aggregate({ where: { createdAt: { gte: startOfYear }, ...naoCancelado }, _sum: { preco: true } }),
      prisma.encordoamento.aggregate({ where: naoCancelado, _sum: { preco: true } }),
      prisma.pedido.aggregate({ where: { createdAt: { gte: startOfToday }, ...naoCancelado }, _sum: { total: true } }),
      prisma.pedido.aggregate({ where: { createdAt: { gte: startOfWeek }, ...naoCancelado }, _sum: { total: true } }),
      prisma.pedido.aggregate({ where: { createdAt: { gte: startOfMonth }, ...naoCancelado }, _sum: { total: true } }),
      prisma.pedido.aggregate({ where: { createdAt: { gte: startOfYear }, ...naoCancelado }, _sum: { total: true } }),
      prisma.pedido.aggregate({ where: naoCancelado, _sum: { total: true } }),
    ])

    const faturamento = {
      hoje: Number(fatEncHoje._sum.preco || 0) + Number(fatPedHoje._sum.total || 0),
      semana: Number(fatEncSemana._sum.preco || 0) + Number(fatPedSemana._sum.total || 0),
      mes: Number(fatEncMes._sum.preco || 0) + Number(fatPedMes._sum.total || 0),
      ano: Number(fatEncAno._sum.preco || 0) + Number(fatPedAno._sum.total || 0),
      consolidado: Number(fatEncTotal._sum.preco || 0) + Number(fatPedTotal._sum.total || 0),
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

    // Loja (cooper) vs Delivery (tudo que não é cooper/loja)
    const totalLoja = await prisma.encordoamento.count({
      where: { centroReceita: { in: ['cooper', 'loja'] } },
    })
    const totalGeral = await prisma.encordoamento.count()
    const totalDelivery = totalGeral - totalLoja
    const totalRetirada = totalLoja

    // Faturamento por centro de receita — também em regime de competência
    // Loja = cooper (loja física). Todo o resto = delivery (leal, vitallis, cpb, lorian, etc.)
    const [fatLojaEnc, fatLojaPed] = await Promise.all([
      prisma.encordoamento.aggregate({
        where: { centroReceita: { in: ['cooper', 'loja'] }, ...naoCancelado },
        _sum: { preco: true },
      }),
      prisma.pedido.aggregate({
        where: { centroReceita: { in: ['cooper', 'loja'] }, ...naoCancelado },
        _sum: { total: true },
      }),
    ])
    const fatLojaVal = Number(fatLojaEnc._sum.preco || 0) + Number(fatLojaPed._sum.total || 0)
    const fatTotalVal = faturamento.consolidado
    const fatDeliveryVal = fatTotalVal - fatLojaVal

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
