import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Buscar todos os pagamentos pendentes com cliente e encordoamento
    const pagamentosPendentes = await prisma.pagamento.findMany({
      where: { status: 'pendente' },
      include: {
        cliente: true,
        encordoamento: {
          include: { corda: true },
        },
      },
      orderBy: { createdAt: 'asc' }, // mais antigos primeiro
    })

    // Agrupar por cliente
    const devedoresMap: Record<string, {
      cliente: { id: string; nome: string; telefone: string; centroReceita: string | null }
      totalDevido: number
      quantidade: number
      dividaMaisAntiga: string
      diasAtraso: number
      itens: {
        id: string
        valor: number
        createdAt: string
        encordoamentoId: string | null
        produto: string
      }[]
    }> = {}

    const agora = Date.now()

    for (const p of pagamentosPendentes) {
      const clienteId = p.cliente.id
      if (!devedoresMap[clienteId]) {
        devedoresMap[clienteId] = {
          cliente: {
            id: p.cliente.id,
            nome: p.cliente.nome,
            telefone: p.cliente.telefone,
            centroReceita: p.cliente.centroReceita,
          },
          totalDevido: 0,
          quantidade: 0,
          dividaMaisAntiga: p.createdAt.toISOString(),
          diasAtraso: 0,
          itens: [],
        }
      }

      const devedor = devedoresMap[clienteId]
      devedor.totalDevido += p.valor
      devedor.quantidade++

      // Atualizar dívida mais antiga
      if (p.createdAt.getTime() < new Date(devedor.dividaMaisAntiga).getTime()) {
        devedor.dividaMaisAntiga = p.createdAt.toISOString()
      }

      // Extrair produto da venda
      const obs = p.encordoamento?.observacoes || ''
      const prodMatch = obs.match(/Produto:\s*(.+?)(\s*\||$)/)
      const produto = p.encordoamento?.corda?.nome
        || (prodMatch ? prodMatch[1].trim() : 'Serviço')

      devedor.itens.push({
        id: p.id,
        valor: p.valor,
        createdAt: p.createdAt.toISOString(),
        encordoamentoId: p.encordoamentoId,
        produto,
      })
    }

    // Calcular dias de atraso
    Object.values(devedoresMap).forEach(d => {
      d.diasAtraso = Math.floor(
        (agora - new Date(d.dividaMaisAntiga).getTime()) / (1000 * 60 * 60 * 24)
      )
    })

    // Ordenar por valor total devido (maiores primeiro)
    const devedores = Object.values(devedoresMap).sort((a, b) => b.totalDevido - a.totalDevido)

    // Totais gerais
    const totalGeral = devedores.reduce((sum, d) => sum + d.totalDevido, 0)
    const totalClientes = devedores.length
    const dividasMaisAntigas = devedores.filter(d => d.diasAtraso >= 30).length

    return Response.json({
      devedores,
      resumo: {
        totalGeral,
        totalClientes,
        dividasMaisAntigas,
      },
    })
  } catch (error) {
    console.error('Erro ao listar devedores:', error)
    return Response.json({ error: 'Erro ao listar devedores' }, { status: 500 })
  }
}
