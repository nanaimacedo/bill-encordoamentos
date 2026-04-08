import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const periodo = searchParams.get('periodo') || 'hoje'
    const busca = searchParams.get('busca') || ''
    const status = searchParams.get('status') || 'todos'

    const now = new Date()
    let dataInicio: Date
    let dataFim: Date | null = null

    // Suporta mês específico no formato YYYY-MM
    if (/^\d{4}-\d{2}$/.test(periodo)) {
      const [ano, mes] = periodo.split('-').map(Number)
      dataInicio = new Date(ano, mes - 1, 1)
      dataFim = new Date(ano, mes, 1) // primeiro dia do mês seguinte
    } else {
      switch (periodo) {
        case 'hoje':
          dataInicio = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'semana': {
          const dia = now.getDay()
          dataInicio = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dia)
          break
        }
        case 'mes':
          dataInicio = new Date(now.getFullYear(), now.getMonth(), 1)
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

    // Contagem de raquetes (parse do observacoes)
    let totalRaquetes = 0
    encordoamentos.forEach(e => {
      const obs = e.observacoes || ''
      if (obs.includes('Venda avulsa')) return // produto avulso, sem raquete
      const match = obs.match(/(\d+)\s*raquete/)
      if (match) {
        totalRaquetes += parseInt(match[1])
      } else {
        // Se não é avulsa e não tem "X raquetes", conta 1
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
