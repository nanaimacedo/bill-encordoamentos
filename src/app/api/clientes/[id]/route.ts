import { prisma } from '@/lib/prisma'

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params

    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: {
        encordoamentos: {
          orderBy: { createdAt: 'desc' },
          include: {
            corda: true,
            pagamento: true,
          },
        },
        pagamentos: {
          orderBy: { createdAt: 'desc' },
        },
        raquetes: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!cliente) {
      return Response.json({ error: 'Cliente nao encontrado' }, { status: 404 })
    }

    return Response.json(cliente)
  } catch (error) {
    console.error('Erro ao buscar cliente:', error)
    return Response.json({ error: 'Erro ao buscar cliente' }, { status: 500 })
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await request.json()

    const cliente = await prisma.cliente.update({
      where: { id },
      data: body,
    })

    return Response.json(cliente)
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error)
    return Response.json({ error: 'Erro ao atualizar cliente' }, { status: 500 })
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params

    await prisma.cliente.delete({
      where: { id },
    })

    return Response.json({ message: 'Cliente removido com sucesso' })
  } catch (error) {
    console.error('Erro ao remover cliente:', error)
    return Response.json({ error: 'Erro ao remover cliente' }, { status: 500 })
  }
}
