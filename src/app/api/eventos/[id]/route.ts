import { prisma } from '@/lib/prisma'

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await request.json()

    const data: Record<string, unknown> = {}

    if (body.titulo !== undefined) data.titulo = body.titulo
    if (body.descricao !== undefined) data.descricao = body.descricao
    if (body.tipo !== undefined) data.tipo = body.tipo
    if (body.data !== undefined) data.data = new Date(body.data)
    if (body.local !== undefined) data.local = body.local
    if (body.vagas !== undefined) data.vagas = body.vagas
    if (body.ativo !== undefined) data.ativo = body.ativo

    if (body.incrementInscritos) {
      data.inscritos = { increment: 1 }
    }

    const evento = await prisma.evento.update({
      where: { id },
      data,
    })

    return Response.json(evento)
  } catch (error) {
    console.error('Erro ao atualizar evento:', error)
    return Response.json({ error: 'Erro ao atualizar evento' }, { status: 500 })
  }
}
