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

    const encordoamento = await prisma.encordoamento.create({
      data: body,
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
