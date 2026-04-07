import { prisma } from '@/lib/prisma'
import webpush from 'web-push'

const VAPID_PUBLIC = 'BLcuQSLvrc8rHK4snSVOn-MeHBNGNIW9FuY7ld0e4d-18V9RZQJybddQDRbyo7VugXWIzakjoaPQ6ARr_bUa77I'
const VAPID_PRIVATE = 'E8jRdmc9H2eN3fj32fznhVArE3AftN4lFq4ziMZGsb8'

webpush.setVapidDetails('mailto:bill@encordoamentos.com', VAPID_PUBLIC, VAPID_PRIVATE)

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000 // meters
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { latitude, longitude } = body

    if (latitude === undefined || longitude === undefined) {
      return Response.json(
        { error: 'latitude e longitude são obrigatórios' },
        { status: 400 }
      )
    }

    // 1. Find all Local within range
    const locais = await prisma.local.findMany({ where: { ativo: true } })

    const locaisProximos = locais.filter((local) => {
      const dist = haversineDistance(latitude, longitude, local.latitude, local.longitude)
      return dist <= local.raio
    })

    if (locaisProximos.length === 0) {
      return Response.json({
        local: null,
        clientesNotificados: 0,
        detalhes: [],
        mensagem: 'Nenhum condomínio próximo encontrado',
      })
    }

    const resultados = []

    for (const local of locaisProximos) {
      // 2. Find clients with same condominio name
      const clientes = await prisma.cliente.findMany({
        where: {
          condominio: { equals: local.nome, mode: 'insensitive' },
        },
        include: {
          encordoamentos: {
            where: { status: 'pronto' },
            include: { corda: true },
          },
          pagamentos: {
            where: { status: 'pendente' },
          },
          pushSubscriptions: true,
        },
      })

      // 3. Filter clients with encordoamentos status 'pronto' or pagamentos status 'pendente'
      const clientesFiltrados = clientes.filter(
        (c) => c.encordoamentos.length > 0 || c.pagamentos.length > 0
      )

      for (const cliente of clientesFiltrados) {
        const motivos: string[] = []
        if (cliente.encordoamentos.length > 0) {
          motivos.push(`${cliente.encordoamentos.length} raquete(s) pronta(s)`)
        }
        if (cliente.pagamentos.length > 0) {
          motivos.push(`${cliente.pagamentos.length} pagamento(s) pendente(s)`)
        }

        const mensagem = `Bill Encordoamentos está no ${local.nome}! ${motivos.join(' e ')}.`

        // 4. Create Notificacao
        await prisma.notificacao.create({
          data: {
            clienteId: cliente.id,
            tipo: 'estou_aqui',
            titulo: `Bill está no ${local.nome}!`,
            mensagem,
            canal: 'push',
          },
        })

        // 5. Send push notifications
        if (cliente.pushSubscriptions.length > 0) {
          const payload = JSON.stringify({
            title: `Bill está no ${local.nome}!`,
            body: mensagem,
            url: '/',
          })

          await Promise.allSettled(
            cliente.pushSubscriptions.map((sub) =>
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

        resultados.push({
          clienteId: cliente.id,
          nome: cliente.nome,
          telefone: cliente.telefone,
          motivos,
          pushEnviado: cliente.pushSubscriptions.length > 0,
        })
      }
    }

    return Response.json({
      local: locaisProximos.map((l) => l.nome).join(', '),
      clientesNotificados: resultados.length,
      detalhes: resultados,
    })
  } catch (error) {
    console.error('Erro no estou-aqui:', error)
    return Response.json({ error: 'Erro ao processar localização' }, { status: 500 })
  }
}
