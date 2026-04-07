import { prisma } from '@/lib/prisma'

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await request.json()

    const pagamento = await prisma.pagamento.update({
      where: { id },
      data: {
        ...body,
        ...(body.status === 'pago' && !body.dataPagamento ? { dataPagamento: new Date() } : {}),
      },
      include: {
        cliente: true,
        encordoamento: true,
      },
    })

    return Response.json(pagamento)
  } catch (error) {
    console.error('Erro ao atualizar pagamento:', error)
    return Response.json({ error: 'Erro ao atualizar pagamento' }, { status: 500 })
  }
}
