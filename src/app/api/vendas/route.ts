import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const periodo = searchParams.get('periodo') || 'hoje'
    const busca = searchParams.get('busca') || ''
    const status = searchParams.get('status') || 'todos'

    // Timezone Brasil (UTC-3)
    const TZ_OFFSET_MS = 3 * 60 * 60 * 1000
    const nowBR = new Date(Date.now() - TZ_OFFSET_MS)
    let dataInicio: Date
    let dataFim: Date | null = null

    // Suporta mês específico no formato YYYY-MM
    if (/^\d{4}-\d{2}$/.test(periodo)) {
      const [ano, mes] = periodo.split('-').map(Number)
      dataInicio = new Date(Date.UTC(ano, mes - 1, 1) + TZ_OFFSET_MS)
      dataFim = new Date(Date.UTC(ano, mes, 1) + TZ_OFFSET_MS)
    } else {
      switch (periodo) {
        case 'hoje':
          dataInicio = new Date(Date.UTC(nowBR.getUTCFullYear(), nowBR.getUTCMonth(), nowBR.getUTCDate()) + TZ_OFFSET_MS)
          break
        case 'semana': {
          const dia = nowBR.getUTCDay()
          const startToday = new Date(Date.UTC(nowBR.getUTCFullYear(), nowBR.getUTCMonth(), nowBR.getUTCDate()) + TZ_OFFSET_MS)
          dataInicio = new Date(startToday.getTime() - dia * 24 * 60 * 60 * 1000)
          break
        }
        case 'mes':
          dataInicio = new Date(Date.UTC(nowBR.getUTCFullYear(), nowBR.getUTCMonth(), 1) + TZ_OFFSET_MS)
          break
        case 'todos':
          dataInicio = new Date(2000, 0, 1)
          break
        default:
          dataInicio = new Date(2000, 0, 1)
      }
    }

    const createdAtFilter: Record<string, unknown> = { gte: dataInicio }
    if (dataFim) createdAtFilter.lt = dataFim

    const where: Record<string, unknown> = {
      createdAt: createdAtFilter,
    }

    if (busca) {
      where.cliente = {
        OR: [
          { nome: { contains: busca, mode: 'insensitive' } },
          { telefone: { contains: busca } },
        ],
      }
    }

    if (status !== 'todos') {
      where.status = status
    }

    const encordoamentos = await prisma.encordoamento.findMany({
      where: where as any,
      include: {
        cliente: true,
        corda: true,
        pagamento: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Totais do período
    const total = encordoamentos.reduce((sum, e) => sum + e.preco, 0)
    const totalPago = encordoamentos
      .filter(e => e.pagamento?.status === 'pago')
      .reduce((sum, e) => sum + e.preco, 0)
    const totalPendente = encordoamentos
      .filter(e => e.pagamento?.status === 'pendente')
      .reduce((sum, e) => sum + e.preco, 0)

    // Contagem de raquetes encordoadas (só conta se teve encordoamento real)
    let totalRaquetes = 0
    encordoamentos.forEach(e => {
      const obs = e.observacoes || ''
      // 1. Venda avulsa (só produto/acessório) — NÃO conta
      if (obs.includes('Venda avulsa')) return
      // 2. Observação explícita "X raquetes" (importação)
      const match = obs.match(/(\d+)\s*raquete/)
      if (match) {
        totalRaquetes += parseInt(match[1])
        return
      }
      // 3. Venda nova: só conta se tiver cordaId (encordoamento real)
      //    Vendas sem cordaId e sem "raquetes" nas obs = acessório, não conta
      if (e.cordaId) {
        totalRaquetes += 1
      }
    })

    return Response.json({
      vendas: encordoamentos,
      resumo: {
        quantidade: encordoamentos.length,
        total,
        totalPago,
        totalPendente,
        totalRaquetes,
      },
    })
  } catch (error) {
    console.error('Erro ao listar vendas:', error)
    return Response.json({ error: 'Erro ao listar vendas' }, { status: 500 })
  }
}
