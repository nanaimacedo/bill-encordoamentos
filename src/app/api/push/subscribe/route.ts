import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { clienteId, subscription } = body

    if (!clienteId || !subscription?.endpoint || !subscription?.keys) {
      return Response.json(
        { error: 'clienteId e subscription são obrigatórios' },
        { status: 400 }
      )
    }

    const { endpoint, keys } = subscription
    const { p256dh, auth } = keys

    // Upsert based on clienteId + endpoint
    const existing = await prisma.pushSubscription.findFirst({
      where: { clienteId, endpoint },
    })

    let sub
    if (existing) {
      sub = await prisma.pushSubscription.update({
        where: { id: existing.id },
        data: { p256dh, auth },
      })
    } else {
      sub = await prisma.pushSubscription.create({
        data: { clienteId, endpoint, p256dh, auth },
      })
    }

    return Response.json(sub, { status: 201 })
  } catch (error) {
    console.error('Erro ao salvar subscription:', error)
    return Response.json({ error: 'Erro ao salvar subscription' }, { status: 500 })
  }
}
