import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { codigo, total } = await request.json()

    if (!codigo) {
      return Response.json({ error: 'Codigo obrigatorio' }, { status: 400 })
    }

    const cupom = await prisma.cupom.findUnique({
      where: { codigo: codigo.toUpperCase() },
    })

    if (!cupom) {
      return Response.json({ error: 'Cupom nao encontrado' }, { status: 404 })
    }

    if (!cupom.ativo) {
      return Response.json({ error: 'Cupom inativo' }, { status: 400 })
    }

    if (cupom.validade && new Date(cupom.validade) < new Date()) {
      return Response.json({ error: 'Cupom expirado' }, { status: 400 })
    }

    if (cupom.usos >= cupom.maxUsos) {
      return Response.json({ error: 'Cupom atingiu o limite de usos' }, { status: 400 })
    }

    if (total < cupom.minimo) {
      return Response.json({ error: `Valor minimo: R$${cupom.minimo.toFixed(2)}` }, { status: 400 })
    }

    let desconto = 0
    if (cupom.tipo === 'percentual') {
      desconto = (total || 0) * (cupom.valor / 100)
    } else {
      desconto = Math.min(cupom.valor, total || 0)
    }

    return Response.json({
      valido: true,
      cupom: {
        id: cupom.id,
        codigo: cupom.codigo,
        tipo: cupom.tipo,
        valor: cupom.valor,
        descricao: cupom.descricao,
      },
      desconto,
    })
  } catch (error) {
    console.error('Erro ao validar cupom:', error)
    return Response.json({ error: 'Erro ao validar cupom' }, { status: 500 })
  }
}
