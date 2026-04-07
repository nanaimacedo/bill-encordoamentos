import { prisma } from '@/lib/prisma'

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const { quantidade } = await request.json()

    if (!quantidade || quantidade < 1) {
      return Response.json({ error: 'Quantidade invalida' }, { status: 400 })
    }

    const item = await prisma.itemCarrinho.update({
      where: { id },
      data: { quantidade },
      include: { produto: true },
    })

    return Response.json(item)
  } catch (error) {
    console.error('Erro ao atualizar item do carrinho:', error)
    return Response.json({ error: 'Erro ao atualizar item do carrinho' }, { status: 500 })
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params

    await prisma.itemCarrinho.delete({
      where: { id },
    })

    return Response.json({ message: 'Item removido do carrinho' })
  } catch (error) {
    console.error('Erro ao remover item do carrinho:', error)
    return Response.json({ error: 'Erro ao remover item do carrinho' }, { status: 500 })
  }
}
