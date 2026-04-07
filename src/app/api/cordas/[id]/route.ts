import { prisma } from '@/lib/prisma'

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params

    const corda = await prisma.corda.findUnique({
      where: { id },
    })

    if (!corda) {
      return Response.json({ error: 'Corda nao encontrada' }, { status: 404 })
    }

    return Response.json(corda)
  } catch (error) {
    console.error('Erro ao buscar corda:', error)
    return Response.json({ error: 'Erro ao buscar corda' }, { status: 500 })
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await request.json()

    const corda = await prisma.corda.update({
      where: { id },
      data: body,
    })

    return Response.json(corda)
  } catch (error) {
    console.error('Erro ao atualizar corda:', error)
    return Response.json({ error: 'Erro ao atualizar corda' }, { status: 500 })
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params

    await prisma.corda.delete({
      where: { id },
    })

    return Response.json({ message: 'Corda removida com sucesso' })
  } catch (error) {
    console.error('Erro ao remover corda:', error)
    return Response.json({ error: 'Erro ao remover corda' }, { status: 500 })
  }
}
