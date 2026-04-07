import { prisma } from '@/lib/prisma'

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await request.json()

    const convite = await prisma.conviteJogo.update({
      where: { id },
      data: {
        status: body.status,
      },
      include: {
        remetente: {
          include: { cliente: { select: { id: true, nome: true } } },
        },
        destinatario: {
          include: { cliente: { select: { id: true, nome: true } } },
        },
      },
    })

    return Response.json(convite)
  } catch (error) {
    console.error('Erro ao atualizar convite:', error)
    return Response.json({ error: 'Erro ao atualizar convite' }, { status: 500 })
  }
}
