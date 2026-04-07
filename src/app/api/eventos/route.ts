import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const eventos = await prisma.evento.findMany({
      where: { ativo: true },
      orderBy: { data: 'asc' },
    })

    return Response.json(eventos)
  } catch (error) {
    console.error('Erro ao listar eventos:', error)
    return Response.json({ error: 'Erro ao listar eventos' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const evento = await prisma.evento.create({
      data: {
        titulo: body.titulo,
        descricao: body.descricao || '',
        tipo: body.tipo,
        data: new Date(body.data),
        local: body.local,
        vagas: body.vagas || 0,
      },
    })

    return Response.json(evento, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar evento:', error)
    return Response.json({ error: 'Erro ao criar evento' }, { status: 500 })
  }
}
