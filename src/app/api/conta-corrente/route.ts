import { prisma } from '@/lib/prisma'

// GET /api/conta-corrente
// Lista clientes com saldo != 0 + resumo
// Query: ?busca=nome
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const busca = (searchParams.get('busca') || '').trim()

    const where: Record<string, unknown> = {
      NOT: { saldoContaCorrente: 0 },
    }
    if (busca) {
      where.nome = { contains: busca, mode: 'insensitive' }
    }

    const clientes = await prisma.cliente.findMany({
      where: where as any,
      select: {
        id: true,
        nome: true,
        telefone: true,
        saldoContaCorrente: true,
        pagamentos: {
          where: { status: 'pendente' },
          select: { id: true, valor: true, createdAt: true },
        },
      },
      orderBy: { saldoContaCorrente: 'desc' },
    })

    const lista = clientes.map(c => {
      const divida = c.pagamentos.reduce((s, p) => s + p.valor, 0)
      return {
        cliente: {
          id: c.id,
          nome: c.nome,
          telefone: c.telefone,
        },
        saldo: c.saldoContaCorrente,
        divida,
        saldoLiquido: c.saldoContaCorrente - divida,
        pendentes: c.pagamentos.length,
      }
    })

    const totalCredito = lista
      .filter(l => l.saldo > 0)
      .reduce((s, l) => s + l.saldo, 0)
    const totalDivida = lista.reduce((s, l) => s + l.divida, 0)

    return Response.json({
      clientes: lista,
      resumo: {
        totalClientes: lista.length,
        totalCredito,
        totalDivida,
        saldoLiquido: totalCredito - totalDivida,
      },
    })
  } catch (error) {
    console.error('Erro ao listar conta corrente:', error)
    return Response.json({ error: 'Erro ao listar conta corrente' }, { status: 500 })
  }
}

// POST /api/conta-corrente
// Registra uma movimentação (credito = entrada, debito = saída)
// Body: { clienteId, tipo, valor, descricao?, abaterPagamentoIds? }
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { clienteId, tipo, valor, descricao, abaterPagamentoIds } = body

    if (!clienteId || !tipo || !valor) {
      return Response.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
    }
    if (tipo !== 'credito' && tipo !== 'debito') {
      return Response.json({ error: 'tipo deve ser credito ou debito' }, { status: 400 })
    }
    if (valor <= 0) {
      return Response.json({ error: 'valor deve ser positivo' }, { status: 400 })
    }

    const resultado = await prisma.$transaction(async tx => {
      const cliente = await tx.cliente.findUnique({ where: { id: clienteId } })
      if (!cliente) throw new Error('Cliente não encontrado')

      // 1. Atualiza saldo
      const delta = tipo === 'credito' ? valor : -valor
      const novoSaldo = cliente.saldoContaCorrente + delta
      await tx.cliente.update({
        where: { id: clienteId },
        data: { saldoContaCorrente: novoSaldo },
      })

      // 2. Registra movimentação principal
      const movimentacao = await tx.movimentacaoConta.create({
        data: {
          clienteId,
          tipo,
          valor,
          descricao: descricao || (tipo === 'credito' ? 'Crédito adicionado' : 'Débito manual'),
        },
      })

      // 3. Se for crédito e o usuário escolheu abater pagamentos específicos
      const pagamentosAbatidos: Array<{ id: string; valor: number }> = []
      if (
        tipo === 'credito' &&
        Array.isArray(abaterPagamentoIds) &&
        abaterPagamentoIds.length > 0
      ) {
        const pendentes = await tx.pagamento.findMany({
          where: {
            id: { in: abaterPagamentoIds },
            clienteId,
            status: 'pendente',
          },
          orderBy: { createdAt: 'asc' },
        })

        let saldoRestante = novoSaldo
        for (const p of pendentes) {
          if (saldoRestante <= 0) break
          if (saldoRestante >= p.valor) {
            // Quita integral
            await tx.pagamento.update({
              where: { id: p.id },
              data: {
                status: 'pago',
                formaPagamento: 'credito-conta',
                dataPagamento: new Date(),
              },
            })
            await tx.movimentacaoConta.create({
              data: {
                clienteId,
                tipo: 'debito',
                valor: p.valor,
                descricao: `Abatimento automático do pagamento ${p.id.slice(0, 8)}`,
                pagamentoId: p.id,
                encordoamentoId: p.encordoamentoId,
                pedidoId: p.pedidoId,
              },
            })
            saldoRestante -= p.valor
            pagamentosAbatidos.push({ id: p.id, valor: p.valor })
          }
        }

        // Ajusta saldo final
        if (pagamentosAbatidos.length > 0) {
          await tx.cliente.update({
            where: { id: clienteId },
            data: { saldoContaCorrente: saldoRestante },
          })
        }
      }

      return { movimentacao, saldoFinal: novoSaldo - pagamentosAbatidos.reduce((s, p) => s + p.valor, 0), pagamentosAbatidos }
    })

    return Response.json(resultado, { status: 201 })
  } catch (error) {
    console.error('Erro ao registrar movimentação:', error)
    const msg = error instanceof Error ? error.message : 'Erro ao registrar movimentação'
    return Response.json({ error: msg }, { status: 500 })
  }
}
