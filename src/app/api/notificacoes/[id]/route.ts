import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const notificacao = await prisma.notificacao.update({
      where: { id },
      data: { lida: true },
      include: { cliente: { select: { id: true, nome: true, telefone: true } } },
    })

    return Response.json(notificacao)
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error)
    return Response.json({ error: 'Erro ao atualizar notificação' }, { status: 500 })
  }
}
