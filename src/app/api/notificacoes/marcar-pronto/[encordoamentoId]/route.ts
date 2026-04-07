import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ encordoamentoId: string }> }
) {
  try {
    const { encordoamentoId } = await params

    const encordoamento = await prisma.encordoamento.findUnique({
      where: { id: encordoamentoId },
      include: { cliente: true, corda: true },
    })

    if (!encordoamento) {
      return Response.json({ error: 'Encordoamento não encontrado' }, { status: 404 })
    }

    const config = await prisma.configAutomacao.findFirst()
    const msgTemplate = config?.msgPronto || 'Olá {nome}! Seu encordoamento está pronto para retirada!'
    const mensagem = msgTemplate.replace('{nome}', encordoamento.cliente.nome)

    const notificacao = await prisma.notificacao.create({
      data: {
        clienteId: encordoamento.clienteId,
        tipo: 'encordoamento_pronto',
        titulo: 'Encordoamento Pronto!',
        mensagem,
      },
      include: { cliente: { select: { id: true, nome: true, telefone: true } } },
    })

    return Response.json(notificacao, { status: 201 })
  } catch (error) {
    console.error('Erro ao notificar encordoamento pronto:', error)
    return Response.json({ error: 'Erro ao criar notificação' }, { status: 500 })
  }
}
