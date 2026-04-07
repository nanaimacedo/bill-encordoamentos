import { prisma } from '@/lib/prisma'

export async function GET(request: Request, context: { params: Promise<{ clienteId: string }> }) {
  try {
    const { clienteId } = await context.params

    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      select: {
        id: true,
        nome: true,
        pontosFidelidade: true,
      },
    })

    if (!cliente) {
      return Response.json({ error: 'Cliente nao encontrado' }, { status: 404 })
    }

    const totalEncordoamentos = await prisma.encordoamento.count({
      where: { clienteId, status: 'entregue' },
    })

    const progressoParaGratis = totalEncordoamentos % 10
    const elegivel = progressoParaGratis === 9 // next one (the 10th) is free

    return Response.json({
      clienteId: cliente.id,
      nome: cliente.nome,
      pontosFidelidade: cliente.pontosFidelidade,
      totalEncordoamentos,
      progressoParaGratis,
      elegivel,
      faltamPara10: 10 - progressoParaGratis - 1,
    })
  } catch (error) {
    console.error('Erro ao buscar fidelidade:', error)
    return Response.json({ error: 'Erro ao buscar fidelidade' }, { status: 500 })
  }
}
