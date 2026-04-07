import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const now = new Date()
    const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const d60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
    const d90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    const cordas = await prisma.corda.findMany({
      where: { ativa: true },
      orderBy: { nome: 'asc' },
    })

    const allEncordoamentos = await prisma.encordoamento.findMany({
      where: { createdAt: { gte: d90 } },
      select: { cordaId: true, createdAt: true },
    })

    const resultado = cordas.map((corda) => {
      const encCorda = allEncordoamentos.filter((e) => e.cordaId === corda.id)

      const uso30d = encCorda.filter((e) => new Date(e.createdAt) >= d30).length
      const uso60d = encCorda.filter((e) => new Date(e.createdAt) >= d60).length
      const uso90d = encCorda.length

      // Trend: compare last 30d vs previous 30d (days 31-60)
      const usoPrevio30d = uso60d - uso30d

      let tendencia: 'subindo' | 'descendo' | 'estavel'
      if (uso30d > usoPrevio30d * 1.2) {
        tendencia = 'subindo'
      } else if (uso30d < usoPrevio30d * 0.8) {
        tendencia = 'descendo'
      } else {
        tendencia = 'estavel'
      }

      // Average monthly usage (based on 90d data)
      const usoMensal = uso90d / 3

      // Days of stock remaining
      const usoDiario = usoMensal / 30
      const diasRestantes =
        usoDiario > 0
          ? Math.round(corda.estoque / usoDiario)
          : corda.estoque > 0
            ? 999
            : 0

      const alertaEstoque = diasRestantes < 7 && usoMensal > 0

      return {
        id: corda.id,
        nome: corda.nome,
        marca: corda.marca,
        tipo: corda.tipo,
        uso30d,
        uso60d,
        uso90d,
        tendencia,
        estoque: corda.estoque,
        diasRestantes,
        alertaEstoque,
      }
    })

    return Response.json({ cordas: resultado })
  } catch (error) {
    console.error('Erro ao analisar demanda:', error)
    return Response.json(
      { error: 'Erro ao analisar demanda' },
      { status: 500 }
    )
  }
}
