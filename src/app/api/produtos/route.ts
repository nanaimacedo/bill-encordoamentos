import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const categoria = searchParams.get('categoria')

    const produtos = await prisma.produto.findMany({
      where: {
        ativo: true,
        ...(categoria ? { categoria } : {}),
      },
      orderBy: { nome: 'asc' },
    })

    return Response.json(produtos)
  } catch (error) {
    console.error('Erro ao listar produtos:', error)
    return Response.json({ error: 'Erro ao listar produtos' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const produto = await prisma.produto.create({
      data: body,
    })

    return Response.json(produto, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar produto:', error)
    return Response.json({ error: 'Erro ao criar produto' }, { status: 500 })
  }
}
