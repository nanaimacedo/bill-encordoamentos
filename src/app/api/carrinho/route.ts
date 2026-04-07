import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get('clienteId')

    if (!clienteId) {
      return Response.json({ error: 'clienteId obrigatorio' }, { status: 400 })
    }

    const itens = await prisma.itemCarrinho.findMany({
      where: { clienteId },
      include: { produto: true },
      orderBy: { createdAt: 'desc' },
    })

    return Response.json(itens)
  } catch (error) {
    console.error('Erro ao listar carrinho:', error)
    return Response.json({ error: 'Erro ao listar carrinho' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { clienteId, produtoId, quantidade } = await request.json()

    if (!clienteId || !produtoId) {
      return Response.json({ error: 'clienteId e produtoId obrigatorios' }, { status: 400 })
    }

    const item = await prisma.itemCarrinho.upsert({
      where: {
        clienteId_produtoId: { clienteId, produtoId },
      },
      update: {
        quantidade: { increment: quantidade || 1 },
      },
      create: {
        clienteId,
        produtoId,
        quantidade: quantidade || 1,
      },
      include: { produto: true },
    })

    return Response.json(item, { status: 201 })
  } catch (error) {
    console.error('Erro ao adicionar ao carrinho:', error)
    return Response.json({ error: 'Erro ao adicionar ao carrinho' }, { status: 500 })
  }
}
