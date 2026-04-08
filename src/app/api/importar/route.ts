import { prisma } from '@/lib/prisma'
import { JANEIRO, FEVEREIRO, MARCO, VendaRow } from './dados'

async function importarMes(vendas: VendaRow[], mesLabel: string) {
  let importados = 0
  let erros = 0
  let novosClientes = 0

  for (const [nome, data, valor, produto, raquetes, pago] of vendas) {
    try {
      let cliente = await prisma.cliente.findFirst({
        where: { nome: { contains: nome, mode: 'insensitive' } },
      })
      if (!cliente) {
        cliente = await prisma.cliente.create({
          data: { nome, telefone: '', centroReceita: 'loja' },
        })
        novosClientes++
      }

      const dataVenda = new Date(data + 'T12:00:00.000Z')
      const isEncordoamento = raquetes > 0
      const obs = [
        `Produto: ${produto}`,
        raquetes > 1 ? `${raquetes} raquetes` : '',
        !isEncordoamento ? 'Venda avulsa' : '',
        `Importado da planilha ${mesLabel}`,
      ].filter(Boolean).join(' | ')

      const enc = await prisma.encordoamento.create({
        data: {
          clienteId: cliente.id,
          preco: valor,
          tipo: 'padrao',
          status: 'concluido',
          entrega: 'retirada',
          centroReceita: 'loja',
          observacoes: obs,
          createdAt: dataVenda,
        },
      })

      await prisma.pagamento.create({
        data: {
          clienteId: cliente.id,
          encordoamentoId: enc.id,
          valor,
          status: pago ? 'pago' : 'pendente',
          formaPagamento: pago ? 'importado' : '',
          dataPagamento: pago ? dataVenda : null,
          createdAt: dataVenda,
        },
      })

      importados++
    } catch (err) {
      erros++
    }
  }

  return { importados, erros, novosClientes, total: vendas.length }
}

export async function POST(request: Request) {
  try {
    const { senha } = await request.json()
    if (senha !== 'importar2026') {
      return Response.json({ error: 'Senha incorreta' }, { status: 401 })
    }

    const jan = await importarMes(JANEIRO, 'Janeiro/2026')
    const fev = await importarMes(FEVEREIRO, 'Fevereiro/2026')
    const mar = await importarMes(MARCO, 'Março/2026')

    return Response.json({
      sucesso: true,
      janeiro: jan,
      fevereiro: fev,
      marco: mar,
      totais: {
        importados: jan.importados + fev.importados + mar.importados,
        erros: jan.erros + fev.erros + mar.erros,
        novosClientes: jan.novosClientes + fev.novosClientes + mar.novosClientes,
      },
    })
  } catch (error) {
    console.error('Erro na importação:', error)
    return Response.json({ error: 'Erro na importação' }, { status: 500 })
  }
}
