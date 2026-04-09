import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { subscription } = body

    if (!subscription?.endpoint) {
      return Response.json({ error: 'Subscription inválida' }, { status: 400 })
    }

    const saved = await prisma.adminPushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      create: {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    })

    return Response.json({ sucesso: true, id: saved.id }, { status: 201 })
  } catch (error) {
    console.error('Erro ao salvar admin subscription:', error)
    return Response.json({ error: 'Erro ao salvar' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const count = await prisma.adminPushSubscription.count()
    return Response.json({ ativo: count > 0, dispositivos: count })
  } catch {
    return Response.json({ ativo: false, dispositivos: 0 })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    if (body?.endpoint) {
      await prisma.adminPushSubscription.delete({ where: { endpoint: body.endpoint } })
    } else {
      await prisma.adminPushSubscription.deleteMany({})
    }
    return Response.json({ sucesso: true })
  } catch {
    return Response.json({ error: 'Erro' }, { status: 500 })
  }
}
