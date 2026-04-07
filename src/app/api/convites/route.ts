import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const perfilId = searchParams.get('perfilId')

    if (!perfilId) {
      return Response.json({ error: 'perfilId obrigatorio' }, { status: 400 })
    }

    const convites = await prisma.conviteJogo.findMany({
      where: {
        OR: [
          { remetenteId: perfilId },
          { destinatarioId: perfilId },
        ],
      },
      include: {
        remetente: {
          include: { cliente: { select: { id: true, nome: true } } },
        },
        destinatario: {
          include: { cliente: { select: { id: true, nome: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return Response.json(convites)
  } catch (error) {
    console.error('Erro ao listar convites:', error)
    return Response.json({ error: 'Erro ao listar convites' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const convite = await prisma.conviteJogo.create({
      data: {
        remetenteId: body.remetenteId,
        destinatarioId: body.destinatarioId,
        data: new Date(body.data),
        local: body.local,
        mensagem: body.mensagem || '',
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

    return Response.json(convite, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar convite:', error)
    return Response.json({ error: 'Erro ao criar convite' }, { status: 500 })
  }
}
