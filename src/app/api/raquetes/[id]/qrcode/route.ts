import { prisma } from '@/lib/prisma'
import QRCode from 'qrcode'
import { NextRequest } from 'next/server'

export async function GET(
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

    const origin = new URL(request.url).origin
    const url = `${origin}/scan/${raquete.qrCode}`
    const qrCodeData = await QRCode.toDataURL(url)

    return Response.json({ qrCodeData, qrCodeId: raquete.qrCode })
  } catch (error) {
    console.error('Erro ao gerar QR code da raquete:', error)
    return Response.json({ error: 'Erro ao gerar QR code' }, { status: 500 })
  }
}
