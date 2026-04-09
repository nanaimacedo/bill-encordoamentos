import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get('clienteId')

    const tentativas = await prisma.tentativaCobranca.findMany({
      where: clienteId ? { clienteId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    // Buscar nomes dos clientes
    const clienteIds = [...new Set(tentativas.map(t => t.clienteId))]
    const clientes = await prisma.cliente.findMany({
      where: { id: { in: clienteIds } },
      select: { id: true, nome: true, telefone: true },
    })
    const clientesMap = Object.fromEntries(clientes.map(c => [c.id, c]))

    return Response.json(
      tentativas.map(t => ({
        ...t,
        cliente: clientesMap[t.clienteId] || null,
      }))
    )
  } catch (error) {
    console.error('Erro ao listar tentativas:', error)
    return Response.json({ error: 'Erro ao listar tentativas' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const tentativa = await prisma.tentativaCobranca.create({
      data: {
        clienteId: body.clienteId,
        pagamentoId: body.pagamentoId || null,
        canal: body.canal || 'whatsapp',
        mensagem: body.mensagem || '',
        observacao: body.observacao || '',
        resultado: body.resultado || 'enviado',
      },
    })

    return Response.json(tentativa, { status: 201 })
  } catch (error) {
    console.error('Erro ao registrar tentativa:', error)
    return Response.json({ error: 'Erro ao registrar tentativa' }, { status: 500 })
  }
}
