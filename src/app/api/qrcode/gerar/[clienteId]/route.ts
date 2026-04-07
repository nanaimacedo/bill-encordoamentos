import { prisma } from '@/lib/prisma'
import QRCode from 'qrcode'
import { NextRequest } from 'next/server'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ clienteId: string }> }
) {
  try {
    const { clienteId } = await context.params

    let cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
    })

    if (!cliente) {
      return Response.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    let qrCodeId = cliente.qrCode

    if (!qrCodeId) {
      qrCodeId = crypto.randomUUID()
      cliente = await prisma.cliente.update({
        where: { id: clienteId },
        data: { qrCode: qrCodeId },
      })
    }

    const origin = new URL(request.url).origin
    const url = `${origin}/scan/${qrCodeId}`
    const qrCodeData = await QRCode.toDataURL(url)

    return Response.json({ qrCodeData, qrCodeId })
  } catch (error) {
    console.error('Erro ao gerar QR code:', error)
    return Response.json({ error: 'Erro ao gerar QR code' }, { status: 500 })
  }
}
