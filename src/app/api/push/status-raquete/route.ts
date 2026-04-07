import { prisma } from '@/lib/prisma'
import webpush from 'web-push'

const VAPID_PUBLIC = 'BLcuQSLvrc8rHK4snSVOn-MeHBNGNIW9FuY7ld0e4d-18V9RZQJybddQDRbyo7VugXWIzakjoaPQ6ARr_bUa77I'
const VAPID_PRIVATE = 'E8jRdmc9H2eN3fj32fznhVArE3AftN4lFq4ziMZGsb8'

webpush.setVapidDetails('mailto:bill@encordoamentos.com', VAPID_PUBLIC, VAPID_PRIVATE)

const statusMessages: Record<string, { titulo: string; mensagem: string }> = {
  em_andamento: {
    titulo: 'Encordoamento iniciado!',
    mensagem: 'Iniciamos o encordoamento da sua raquete',
  },
  pronto: {
    titulo: 'Raquete pronta!',
    mensagem: 'Sua raquete está pronta!',
  },
  saiu_delivery: {
    titulo: 'Raquete a caminho!',
    mensagem: 'Sua raquete saiu para delivery!',
  },
  entregue: {
    titulo: 'Raquete entregue!',
    mensagem: 'Raquete entregue! Bom jogo!',
  },
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { encordoamentoId, novoStatus } = body

    if (!encordoamentoId || !novoStatus) {
      return Response.json(
        { error: 'encordoamentoId e novoStatus são obrigatórios' },
        { status: 400 }
      )
    }

    // Update encordoamento status
    const encordoamento = await prisma.encordoamento.update({
      where: { id: encordoamentoId },
      data: { status: novoStatus },
      include: {
        cliente: {
          include: { pushSubscriptions: true },
        },
        corda: true,
      },
    })

    const msg = statusMessages[novoStatus] || {
      titulo: 'Atualização do encordoamento',
      mensagem: `Status atualizado para: ${novoStatus}`,
    }

    // Create Notificacao
    await prisma.notificacao.create({
      data: {
        clienteId: encordoamento.clienteId,
        tipo: 'status_raquete',
        titulo: msg.titulo,
        mensagem: `${msg.mensagem} (${encordoamento.corda.nome})`,
        canal: 'push',
      },
    })

    // Send push notifications
    const subs = encordoamento.cliente.pushSubscriptions
    if (subs.length > 0) {
      const payload = JSON.stringify({
        title: msg.titulo,
        body: `${msg.mensagem} (${encordoamento.corda.nome})`,
        url: '/',
      })

      await Promise.allSettled(
        subs.map((sub) =>
          webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload
          )
        )
      )
    }

    return Response.json({
      success: true,
      encordoamento: {
        id: encordoamento.id,
        status: encordoamento.status,
        cliente: encordoamento.cliente.nome,
        corda: encordoamento.corda.nome,
      },
      notificacao: msg,
    })
  } catch (error) {
    console.error('Erro ao atualizar status:', error)
    return Response.json({ error: 'Erro ao atualizar status' }, { status: 500 })
  }
}
