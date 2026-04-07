import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get('clienteId')
    const lida = searchParams.get('lida')

    const where: Record<string, unknown> = {}
    if (clienteId) where.clienteId = clienteId
    if (lida === 'true') where.lida = true
    if (lida === 'false') where.lida = false

    const notificacoes = await prisma.notificacao.findMany({
      where,
      include: { cliente: { select: { id: true, nome: true, telefone: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return Response.json(notificacoes)
  } catch (error) {
    console.error('Erro ao listar notificações:', error)
    return Response.json({ error: 'Erro ao listar notificações' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const notificacao = await prisma.notificacao.create({
      data: {
        clienteId: body.clienteId,
        tipo: body.tipo,
        titulo: body.titulo,
        mensagem: body.mensagem,
        canal: body.canal || 'sistema',
      },
      include: { cliente: { select: { id: true, nome: true, telefone: true } } },
    })

    return Response.json(notificacao, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar notificação:', error)
    return Response.json({ error: 'Erro ao criar notificação' }, { status: 500 })
  }
}
