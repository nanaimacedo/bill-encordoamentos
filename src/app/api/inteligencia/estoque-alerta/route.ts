import { prisma } from '@/lib/prisma'

export async function GET() {
  const cordasBaixas = await prisma.corda.findMany({
    where: { estoque: { lt: 5 }, ativa: true },
    orderBy: { estoque: 'asc' },
  })
  const produtosBaixos = await prisma.produto.findMany({
    where: { estoque: { lt: 5 }, ativo: true },
    orderBy: { estoque: 'asc' },
  })
  return Response.json({ cordasBaixas, produtosBaixos, total: cordasBaixas.length + produtosBaixos.length })
}
