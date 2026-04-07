import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const now = new Date()
    const limite60d = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    // Get all clients with their encordoamentos
    const clientes = await prisma.cliente.findMany({
      include: {
        encordoamentos: {
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        },
      },
    })

    const emRisco = []
    let totalAtivos = 0

    for (const cliente of clientes) {
      const total = cliente.encordoamentos.length
      if (total < 2) continue // Need at least 2 encordoamentos

      const ultimo = new Date(cliente.encordoamentos[0].createdAt)
      const diasSemVoltar = Math.floor(
        (now.getTime() - ultimo.getTime()) / (1000 * 60 * 60 * 24)
      )

      // Calculate average frequency between encordoamentos
      let somaIntervalos = 0
      for (let i = 0; i < cliente.encordoamentos.length - 1; i++) {
        const atual = new Date(cliente.encordoamentos[i].createdAt)
        const anterior = new Date(cliente.encordoamentos[i + 1].createdAt)
        somaIntervalos += Math.floor(
          (atual.getTime() - anterior.getTime()) / (1000 * 60 * 60 * 24)
        )
      }
      const frequenciaMedia = Math.round(
        somaIntervalos / (cliente.encordoamentos.length - 1)
      )

      if (ultimo < limite60d) {
        emRisco.push({
          cliente: {
            id: cliente.id,
            nome: cliente.nome,
            telefone: cliente.telefone,
          },
          ultimoEncordoamento: cliente.encordoamentos[0].createdAt,
          diasSemVoltar,
          frequenciaMedia,
          totalEncordoamentos: total,
        })
      } else {
        totalAtivos++
      }
    }

    // Sort by days since last visit (descending)
    emRisco.sort((a, b) => b.diasSemVoltar - a.diasSemVoltar)

    return Response.json({
      emRisco,
      totalEmRisco: emRisco.length,
      totalAtivos,
    })
  } catch (error) {
    console.error('Erro ao analisar churn:', error)
    return Response.json(
      { error: 'Erro ao analisar churn' },
      { status: 500 }
    )
  }
}
