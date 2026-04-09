import { prisma } from '@/lib/prisma'

// GET /api/conta-corrente/[clienteId]
// Retorna o extrato do cliente (movimentações + pagamentos pendentes)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ clienteId: string }> }
) {
  try {
    const { clienteId } = await params

    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      select: {
        id: true,
        nome: true,
        telefone: true,
        saldoContaCorrente: true,
      },
    })

    if (!cliente) {
      return Response.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    const movimentacoes = await prisma.movimentacaoConta.findMany({
      where: { clienteId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    const pendentes = await prisma.pagamento.findMany({
      where: { clienteId, status: 'pendente' },
      include: {
        encordoamento: { include: { corda: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    const divida = pendentes.reduce((s, p) => s + p.valor, 0)

    return Response.json({
      cliente,
      saldo: cliente.saldoContaCorrente,
      divida,
      saldoLiquido: cliente.saldoContaCorrente - divida,
      movimentacoes,
      pendentes: pendentes.map(p => ({
        id: p.id,
        valor: p.valor,
        createdAt: p.createdAt,
        encordoamentoId: p.encordoamentoId,
        descricao:
          p.encordoamento?.corda?.nome ||
          p.encordoamento?.observacoes ||
          'Serviço',
      })),
    })
  } catch (error) {
    console.error('Erro ao carregar extrato:', error)
    return Response.json({ error: 'Erro ao carregar extrato' }, { status: 500 })
  }
}
