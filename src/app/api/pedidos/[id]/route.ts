import { prisma } from '@/lib/prisma'

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params

    const pedido = await prisma.pedido.findUnique({
      where: { id },
      include: {
        itens: { include: { produto: true } },
        pagamento: true,
        cliente: { select: { id: true, nome: true, telefone: true } },
        cupom: true,
      },
    })

    if (!pedido) {
      return Response.json({ error: 'Pedido nao encontrado' }, { status: 404 })
    }

    return Response.json(pedido)
  } catch (error) {
    console.error('Erro ao buscar pedido:', error)
    return Response.json({ error: 'Erro ao buscar pedido' }, { status: 500 })
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const { status } = await request.json()

    const pedido = await prisma.pedido.update({
      where: { id },
      data: {
        status,
        ...(status === 'entregue'
          ? { updatedAt: new Date() }
          : {}),
      },
      include: {
        itens: { include: { produto: true } },
        pagamento: true,
        cliente: { select: { id: true, nome: true, telefone: true } },
      },
    })

    // If delivered, mark payment as paid
    if (status === 'entregue' && pedido.pagamento) {
      await prisma.pagamento.update({
        where: { id: pedido.pagamento.id },
        data: { status: 'pago', dataPagamento: new Date() },
      })
    }

    return Response.json(pedido)
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error)
    return Response.json({ error: 'Erro ao atualizar pedido' }, { status: 500 })
  }
}
