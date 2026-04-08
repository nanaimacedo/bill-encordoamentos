import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get('clienteId')

    const encordoamentos = await prisma.encordoamento.findMany({
      where: clienteId ? { clienteId } : undefined,
      include: {
        cliente: true,
        corda: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return Response.json(encordoamentos)
  } catch (error) {
    console.error('Erro ao listar encordoamentos:', error)
    return Response.json({ error: 'Erro ao listar encordoamentos' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const data: Record<string, unknown> = {
      clienteId: body.clienteId,
      preco: body.preco || 0,
      tipo: body.tipo || 'padrao',
      status: body.status || 'pendente',
      entrega: body.entrega || 'retirada',
      enderecoEntrega: body.enderecoEntrega || '',
      taxaDelivery: body.taxaDelivery || 0,
      centroReceita: body.centroReceita || 'loja',
      observacoes: body.observacoes || '',
    }

    // Corda é opcional (venda avulsa pode não ter)
    if (body.cordaId) {
      data.cordaId = body.cordaId
      data.tensao = body.tensao || 0
      data.tensaoCross = body.tensaoCross || null
    }

    const encordoamento = await prisma.encordoamento.create({
      data: data as any,
      include: {
        cliente: true,
        corda: true,
      },
    })

    // Auto-create pagamento pendente
    await prisma.pagamento.create({
      data: {
        clienteId: encordoamento.clienteId,
        encordoamentoId: encordoamento.id,
        valor: encordoamento.preco,
        status: 'pendente',
      },
    })

    return Response.json(encordoamento, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar encordoamento:', error)
    return Response.json({ error: 'Erro ao criar encordoamento' }, { status: 500 })
  }
}
