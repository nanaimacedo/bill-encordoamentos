import { prisma } from '@/lib/prisma'
import webpush from 'web-push'

const VAPID_PUBLIC = 'BLcuQSLvrc8rHK4snSVOn-MeHBNGNIW9FuY7ld0e4d-18V9RZQJybddQDRbyo7VugXWIzakjoaPQ6ARr_bUa77I'
const VAPID_PRIVATE = 'E8jRdmc9H2eN3fj32fznhVArE3AftN4lFq4ziMZGsb8'

webpush.setVapidDetails('mailto:bill@encordoamentos.com', VAPID_PUBLIC, VAPID_PRIVATE)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { clienteIds, title, body: messageBody, url } = body

    if (!clienteIds?.length || !title) {
      return Response.json(
        { error: 'clienteIds e title são obrigatórios' },
        { status: 400 }
      )
    }

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { clienteId: { in: clienteIds } },
    })

    const payload = JSON.stringify({ title, body: messageBody, url })

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        )
      )
    )

    const enviadas = results.filter((r) => r.status === 'fulfilled').length
    const falhas = results.filter((r) => r.status === 'rejected').length

    return Response.json({ enviadas, falhas, total: subscriptions.length })
  } catch (error) {
    console.error('Erro ao enviar push:', error)
    return Response.json({ error: 'Erro ao enviar push' }, { status: 500 })
  }
}
