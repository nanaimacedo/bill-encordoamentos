import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { senha, acao } = await request.json()
    if (senha !== 'importar2026') {
      return Response.json({ error: 'Senha incorreta' }, { status: 401 })
    }

    if (acao === 'limpar-e-abrir') {
      // 1. Deletar pagamentos de vendas manuais (sem 'Importado da planilha')
      const vendasManuais = await prisma.encordoamento.findMany({
        where: {
          NOT: { observacoes: { contains: 'Importado da planilha' } },
        },
        select: { id: true },
      })

      const idsManual = vendasManuais.map(v => v.id)

      // Deletar pagamentos das vendas manuais
      const pagDeletados = await prisma.pagamento.deleteMany({
        where: { encordoamentoId: { in: idsManual } },
      })

      // Deletar as vendas manuais
      const encDeletados = await prisma.encordoamento.deleteMany({
        where: { id: { in: idsManual } },
      })

      // 2. Colocar TODOS os pagamentos importados como pendente
      const pagAtualizados = await prisma.pagamento.updateMany({
        where: {
          encordoamento: {
            observacoes: { contains: 'Importado da planilha' },
          },
        },
        data: {
          status: 'pendente',
          formaPagamento: '',
          dataPagamento: null,
        },
      })

      return Response.json({
        sucesso: true,
        vendasManuaisDeletadas: encDeletados.count,
        pagamentosManuaisDeletados: pagDeletados.count,
        pagamentosAbertos: pagAtualizados.count,
        mensagem: `${encDeletados.count} vendas manuais removidas. ${pagAtualizados.count} pagamentos abertos para você marcar quem pagou.`,
      })
    }

    return Response.json({ error: 'Ação não reconhecida' }, { status: 400 })
  } catch (error) {
    console.error('Erro:', error)
    return Response.json({ error: 'Erro na operação' }, { status: 500 })
  }
}
