import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get('clienteId')

    const where = clienteId ? { clienteId } : {}

    const raquetes = await prisma.raquete.findMany({
      where,
      include: {
        cliente: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return Response.json(raquetes)
  } catch (error) {
    console.error('Erro ao buscar raquetes:', error)
    return Response.json({ error: 'Erro ao buscar raquetes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clienteId, marca, modelo } = body

    if (!clienteId || !marca || !modelo) {
      return Response.json(
        { error: 'clienteId, marca e modelo são obrigatórios' },
        { status: 400 }
      )
    }

    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
    })

    if (!cliente) {
      return Response.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    const raquete = await prisma.raquete.create({
      data: {
        clienteId,
        marca,
        modelo,
        qrCode: crypto.randomUUID(),
      },
      include: {
        cliente: true,
      },
    })

    return Response.json(raquete, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar raquete:', error)
    return Response.json({ error: 'Erro ao criar raquete' }, { status: 500 })
  }
}
