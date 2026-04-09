import { prisma } from '@/lib/prisma'
import webpush from 'web-push'

const VAPID_PUBLIC = 'BLcuQSLvrc8rHK4snSVOn-MeHBNGNIW9FuY7ld0e4d-18V9RZQJybddQDRbyo7VugXWIzakjoaPQ6ARr_bUa77I'
const VAPID_PRIVATE = 'E8jRdmc9H2eN3fj32fznhVArE3AftN4lFq4ziMZGsb8'

webpush.setVapidDetails(
  'mailto:bill@encordoamentos.com',
  VAPID_PUBLIC,
  VAPID_PRIVATE
)

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export async function GET(request: Request) {
  // Aceita tanto GET (pro cron scheduler) quanto POST (manual)
  return executar(request)
}

export async function POST(request: Request) {
  return executar(request)
}

async function executar(_request: Request) {
  try {
    const agora = new Date()
    // Vendas pendentes criadas há mais de 24h
    const umDiaAtras = new Date(agora.getTime() - 24 * 60 * 60 * 1000)

    const pagamentosPendentes = await prisma.pagamento.findMany({
      where: {
        status: 'pendente',
        createdAt: { lt: umDiaAtras },
      },
      include: { cliente: true },
    })

    if (pagamentosPendentes.length === 0) {
      return Response.json({ mensagem: 'Nenhum pendente há mais de 1 dia', enviados: 0 })
    }

    // Agrupa por cliente
    const porCliente: Record<string, { nome: string; total: number; qtd: number }> = {}
    for (const p of pagamentosPendentes) {
      if (!porCliente[p.clienteId]) {
        porCliente[p.clienteId] = { nome: p.cliente.nome, total: 0, qtd: 0 }
      }
      porCliente[p.clienteId].total += p.valor
      porCliente[p.clienteId].qtd++
    }

    const totalGeral = Object.values(porCliente).reduce((s, c) => s + c.total, 0)
    const qtdClientes = Object.keys(porCliente).length
    const qtdVendas = pagamentosPendentes.length

    // Top 3 devedores pra listar
    const top = Object.entries(porCliente)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 3)

    const titulo = `Bill, Verificar pendências 💰`
    const corpo =
      `${qtdVendas} venda${qtdVendas !== 1 ? 's' : ''} a receber · ${formatBRL(totalGeral)}\n` +
      top.map(([, c]) => `• ${c.nome}: ${formatBRL(c.total)}`).join('\n')

    // Buscar todos os dispositivos admin inscritos
    const subs = await prisma.adminPushSubscription.findMany()

    if (subs.length === 0) {
      return Response.json({
        mensagem: 'Nenhum dispositivo admin inscrito',
        pendentes: qtdVendas,
        total: totalGeral,
      })
    }

    let enviados = 0
    let falhas = 0
    const endpointsInvalidos: string[] = []

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify({
            title: titulo,
            body: corpo,
            url: '/devedores',
            tag: 'pendentes-diario',
          })
        )
        enviados++
      } catch (err: any) {
        falhas++
        if (err.statusCode === 410 || err.statusCode === 404) {
          endpointsInvalidos.push(sub.endpoint)
        }
      }
    }

    // Limpar endpoints inválidos
    if (endpointsInvalidos.length > 0) {
      await prisma.adminPushSubscription.deleteMany({
        where: { endpoint: { in: endpointsInvalidos } },
      })
    }

    return Response.json({
      sucesso: true,
      enviados,
      falhas,
      pendentes: qtdVendas,
      clientes: qtdClientes,
      total: totalGeral,
    })
  } catch (error) {
    console.error('Erro no cron verificar-pendentes:', error)
    return Response.json({ error: 'Erro ao verificar pendentes' }, { status: 500 })
  }
}
