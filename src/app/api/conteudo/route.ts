import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const categoria = searchParams.get('categoria')

    const conteudos = await prisma.conteudoEducativo.findMany({
      where: categoria ? { categoria } : undefined,
      orderBy: { createdAt: 'desc' },
    })

    return Response.json(conteudos)
  } catch (error) {
    console.error('Erro ao listar conteudos:', error)
    return Response.json({ error: 'Erro ao listar conteudos' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const conteudo = await prisma.conteudoEducativo.create({
      data: body,
    })

    return Response.json(conteudo, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar conteudo:', error)
    return Response.json({ error: 'Erro ao criar conteudo' }, { status: 500 })
  }
}
