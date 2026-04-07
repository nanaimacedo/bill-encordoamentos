import { prisma } from '@/lib/prisma'

export async function GET(request: Request, context: { params: Promise<{ clienteId: string }> }) {
  try {
    const { clienteId } = await context.params

    const ultimoEncordoamento = await prisma.encordoamento.findFirst({
      where: { clienteId },
      orderBy: { createdAt: 'desc' },
      include: {
        cliente: true,
        corda: true,
      },
    })

    if (!ultimoEncordoamento) {
      return Response.json({ error: 'Nenhum encordoamento encontrado para este cliente' }, { status: 404 })
    }

    return Response.json(ultimoEncordoamento)
  } catch (error) {
    console.error('Erro ao buscar ultimo encordoamento:', error)
    return Response.json({ error: 'Erro ao buscar ultimo encordoamento' }, { status: 500 })
  }
}
