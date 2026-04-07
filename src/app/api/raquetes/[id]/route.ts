import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    const raquete = await prisma.raquete.findUnique({
      where: { id },
      include: {
        cliente: true,
      },
    })

    if (!raquete) {
      return Response.json({ error: 'Raquete não encontrada' }, { status: 404 })
    }

    return Response.json(raquete)
  } catch (error) {
    console.error('Erro ao buscar raquete:', error)
    return Response.json({ error: 'Erro ao buscar raquete' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    const raquete = await prisma.raquete.findUnique({
      where: { id },
    })

    if (!raquete) {
      return Response.json({ error: 'Raquete não encontrada' }, { status: 404 })
    }

    await prisma.raquete.delete({
      where: { id },
    })

    return Response.json({ message: 'Raquete removida com sucesso' })
  } catch (error) {
    console.error('Erro ao remover raquete:', error)
    return Response.json({ error: 'Erro ao remover raquete' }, { status: 500 })
  }
}
