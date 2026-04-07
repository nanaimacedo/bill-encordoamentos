import { prisma } from '@/lib/prisma'

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params

    const produto = await prisma.produto.findUnique({
      where: { id },
    })

    if (!produto) {
      return Response.json({ error: 'Produto nao encontrado' }, { status: 404 })
    }

    return Response.json(produto)
  } catch (error) {
    console.error('Erro ao buscar produto:', error)
    return Response.json({ error: 'Erro ao buscar produto' }, { status: 500 })
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await request.json()

    const produto = await prisma.produto.update({
      where: { id },
      data: body,
    })

    return Response.json(produto)
  } catch (error) {
    console.error('Erro ao atualizar produto:', error)
    return Response.json({ error: 'Erro ao atualizar produto' }, { status: 500 })
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params

    await prisma.produto.delete({
      where: { id },
    })

    return Response.json({ message: 'Produto removido com sucesso' })
  } catch (error) {
    console.error('Erro ao remover produto:', error)
    return Response.json({ error: 'Erro ao remover produto' }, { status: 500 })
  }
}
