import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get('clienteId')
    const status = searchParams.get('status')

    const pagamentos = await prisma.pagamento.findMany({
      where: {
        ...(clienteId ? { clienteId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        cliente: true,
        encordoamento: {
          include: { corda: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return Response.json(pagamentos)
  } catch (error) {
    console.error('Erro ao listar pagamentos:', error)
    return Response.json({ error: 'Erro ao listar pagamentos' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const pagamento = await prisma.pagamento.create({
      data: body,
      include: {
        cliente: true,
        encordoamento: true,
      },
    })

    return Response.json(pagamento, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar pagamento:', error)
    return Response.json({ error: 'Erro ao criar pagamento' }, { status: 500 })
  }
}
