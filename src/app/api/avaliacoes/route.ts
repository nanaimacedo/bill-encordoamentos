import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const cordaId = searchParams.get('cordaId')

    const where = cordaId ? { cordaId } : {}

    const avaliacoes = await prisma.avaliacao.findMany({
      where,
      include: {
        cliente: { select: { id: true, nome: true } },
        corda: { select: { id: true, nome: true, marca: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const media = avaliacoes.length > 0
      ? avaliacoes.reduce((acc, a) => acc + a.nota, 0) / avaliacoes.length
      : 0

    return Response.json({ avaliacoes, media: Math.round(media * 10) / 10 })
  } catch (error) {
    console.error('Erro ao listar avaliacoes:', error)
    return Response.json({ error: 'Erro ao listar avaliacoes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const nota = Math.min(5, Math.max(1, Math.round(body.nota)))

    const avaliacao = await prisma.avaliacao.upsert({
      where: {
        clienteId_cordaId: {
          clienteId: body.clienteId,
          cordaId: body.cordaId,
        },
      },
      update: {
        nota,
        comentario: body.comentario || '',
      },
      create: {
        clienteId: body.clienteId,
        cordaId: body.cordaId,
        nota,
        comentario: body.comentario || '',
      },
      include: {
        cliente: { select: { id: true, nome: true } },
        corda: { select: { id: true, nome: true, marca: true } },
      },
    })

    return Response.json(avaliacao, { status: 201 })
  } catch (error) {
    console.error('Erro ao salvar avaliacao:', error)
    return Response.json({ error: 'Erro ao salvar avaliacao' }, { status: 500 })
  }
}
