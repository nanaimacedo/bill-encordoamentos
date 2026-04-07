import { prisma } from '@/lib/prisma'

const NOMES_MESES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
]

export async function GET() {
  try {
    const encordoamentos = await prisma.encordoamento.findMany({
      select: { createdAt: true },
    })

    // Group by month (0-11)
    const contagemPorMes = new Array(12).fill(0)

    for (const enc of encordoamentos) {
      const mes = new Date(enc.createdAt).getMonth()
      contagemPorMes[mes]++
    }

    const meses = NOMES_MESES.map((nome, i) => ({
      mes: nome,
      total: contagemPorMes[i],
    }))

    let melhorMes = meses[0]
    let piorMes = meses[0]

    for (const m of meses) {
      if (m.total > melhorMes.total) melhorMes = m
      if (m.total < piorMes.total) piorMes = m
    }

    return Response.json({
      meses,
      melhorMes: melhorMes.mes,
      piorMes: piorMes.mes,
      totalEncordoamentos: encordoamentos.length,
    })
  } catch (error) {
    console.error('Erro ao analisar sazonalidade:', error)
    return Response.json(
      { error: 'Erro ao analisar sazonalidade' },
      { status: 500 }
    )
  }
}
