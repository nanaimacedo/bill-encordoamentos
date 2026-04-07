import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params

    // First try to find a Cliente with this QR code
    const cliente = await prisma.cliente.findUnique({
      where: { qrCode: code },
      include: {
        encordoamentos: {
          include: {
            corda: true,
            pagamento: true,
          },
        },
        raquetes: true,
      },
    })

    if (cliente) {
      return Response.json({ tipo: 'cliente', cliente })
    }

    // If not found, try to find a Raquete with this QR code
    const raquete = await prisma.raquete.findUnique({
      where: { qrCode: code },
      include: {
        cliente: {
          include: {
            encordoamentos: {
              include: {
                corda: true,
                pagamento: true,
              },
            },
            raquetes: true,
          },
        },
      },
    })

    if (raquete) {
      return Response.json({
        tipo: 'raquete',
        cliente: raquete.cliente,
        raquete,
      })
    }

    return Response.json({ error: 'QR code não encontrado' }, { status: 404 })
  } catch (error) {
    console.error('Erro ao buscar QR code:', error)
    return Response.json({ error: 'Erro ao buscar QR code' }, { status: 500 })
  }
}
