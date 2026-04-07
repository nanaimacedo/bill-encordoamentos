import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const cupons = await prisma.cupom.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return Response.json(cupons)
  } catch (error) {
    console.error('Erro ao listar cupons:', error)
    return Response.json({ error: 'Erro ao listar cupons' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const cupom = await prisma.cupom.create({
      data: {
        codigo: body.codigo.toUpperCase(),
        descricao: body.descricao || '',
        tipo: body.tipo,
        valor: body.valor,
        minimo: body.minimo || 0,
        maxUsos: body.maxUsos || 100,
        validade: body.validade ? new Date(body.validade) : null,
      },
    })

    return Response.json(cupom, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar cupom:', error)
    return Response.json({ error: 'Erro ao criar cupom' }, { status: 500 })
  }
}
