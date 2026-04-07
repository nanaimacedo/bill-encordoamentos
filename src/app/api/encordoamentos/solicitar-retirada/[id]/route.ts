import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    const encordoamento = await prisma.encordoamento.findUnique({
      where: { id },
    })

    if (!encordoamento) {
      return Response.json(
        { error: 'Encordoamento não encontrado' },
        { status: 404 }
      )
    }

    if (encordoamento.status !== 'pronto') {
      return Response.json(
        { error: 'Encordoamento não está com status "pronto"' },
        { status: 400 }
      )
    }

    const now = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    const novaObs = encordoamento.observacoes
      ? `${encordoamento.observacoes}\nCliente solicitou retirada em ${now}`
      : `Cliente solicitou retirada em ${now}`

    const updated = await prisma.encordoamento.update({
      where: { id },
      data: {
        entrega: 'retirada',
        observacoes: novaObs,
      },
      include: {
        cliente: true,
        corda: true,
        pagamento: true,
      },
    })

    return Response.json(updated)
  } catch (error) {
    console.error('Erro ao solicitar retirada:', error)
    return Response.json(
      { error: 'Erro ao solicitar retirada' },
      { status: 500 }
    )
  }
}
