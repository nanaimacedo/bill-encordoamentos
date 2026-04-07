import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get('clienteId')

    const pedidos = await prisma.pedido.findMany({
      where: clienteId ? { clienteId } : {},
      include: {
        itens: { include: { produto: true } },
        pagamento: true,
        cliente: { select: { id: true, nome: true, telefone: true } },
        cupom: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return Response.json(pedidos)
  } catch (error) {
    console.error('Erro ao listar pedidos:', error)
    return Response.json({ error: 'Erro ao listar pedidos' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { clienteId, entrega, enderecoEntrega, taxaDelivery, cupomCodigo } = await request.json()

    if (!clienteId) {
      return Response.json({ error: 'clienteId obrigatorio' }, { status: 400 })
    }

    // Get cart items
    const itensCarrinho = await prisma.itemCarrinho.findMany({
      where: { clienteId },
      include: { produto: true },
    })

    if (itensCarrinho.length === 0) {
      return Response.json({ error: 'Carrinho vazio' }, { status: 400 })
    }

    // Calculate subtotal
    let subtotal = itensCarrinho.reduce((sum, item) => sum + item.produto.preco * item.quantidade, 0)
    const deliveryFee = taxaDelivery || 0

    // Validate cupom if provided
    let cupomId: string | null = null
    let desconto = 0

    if (cupomCodigo) {
      const cupom = await prisma.cupom.findUnique({
        where: { codigo: cupomCodigo },
      })

      if (!cupom) {
        return Response.json({ error: 'Cupom nao encontrado' }, { status: 400 })
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
      if (subtotal < cupom.minimo) {
        return Response.json({ error: `Valor minimo para esse cupom: R$${cupom.minimo.toFixed(2)}` }, { status: 400 })
      }

      cupomId = cupom.id
      if (cupom.tipo === 'percentual') {
        desconto = subtotal * (cupom.valor / 100)
      } else {
        desconto = Math.min(cupom.valor, subtotal)
      }

      // Increment cupom usage
      await prisma.cupom.update({
        where: { id: cupom.id },
        data: { usos: { increment: 1 } },
      })
    }

    const total = subtotal - desconto + deliveryFee

    // Create pedido with items and payment in a transaction
    const pedido = await prisma.$transaction(async (tx) => {
      const novoPedido = await tx.pedido.create({
        data: {
          clienteId,
          status: 'pendente',
          total,
          entrega: entrega || 'retirada',
          enderecoEntrega: enderecoEntrega || '',
          taxaDelivery: deliveryFee,
          cupomId,
          desconto,
          itens: {
            create: itensCarrinho.map((item) => ({
              produtoId: item.produtoId,
              quantidade: item.quantidade,
              precoUnit: item.produto.preco,
            })),
          },
        },
        include: {
          itens: { include: { produto: true } },
        },
      })

      // Create payment
      await tx.pagamento.create({
        data: {
          clienteId,
          pedidoId: novoPedido.id,
          valor: total,
          status: 'pendente',
        },
      })

      // Decrement stock
      for (const item of itensCarrinho) {
        await tx.produto.update({
          where: { id: item.produtoId },
          data: { estoque: { decrement: item.quantidade } },
        })
      }

      // Clear cart
      await tx.itemCarrinho.deleteMany({
        where: { clienteId },
      })

      return novoPedido
    })

    return Response.json(pedido, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar pedido:', error)
    return Response.json({ error: 'Erro ao criar pedido' }, { status: 500 })
  }
}
