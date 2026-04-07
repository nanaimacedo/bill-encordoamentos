import { prisma } from '@/lib/prisma'

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params

    const encordoamento = await prisma.encordoamento.findUnique({
      where: { id },
      include: {
        cliente: true,
        corda: true,
      },
    })

    if (!encordoamento) {
      return Response.json({ error: 'Encordoamento nao encontrado' }, { status: 404 })
    }

    return Response.json(encordoamento)
  } catch (error) {
    console.error('Erro ao buscar encordoamento:', error)
    return Response.json({ error: 'Erro ao buscar encordoamento' }, { status: 500 })
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await request.json()

    const encordoamento = await prisma.encordoamento.update({
      where: { id },
      data: body,
      include: {
        cliente: true,
        corda: true,
      },
    })

    return Response.json(encordoamento)
  } catch (error) {
    console.error('Erro ao atualizar encordoamento:', error)
    return Response.json({ error: 'Erro ao atualizar encordoamento' }, { status: 500 })
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params

    await prisma.encordoamento.delete({
      where: { id },
    })

    return Response.json({ message: 'Encordoamento removido com sucesso' })
  } catch (error) {
    console.error('Erro ao remover encordoamento:', error)
    return Response.json({ error: 'Erro ao remover encordoamento' }, { status: 500 })
  }
}
