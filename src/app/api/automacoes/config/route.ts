import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    let config = await prisma.configAutomacao.findFirst()

    if (!config) {
      config = await prisma.configAutomacao.create({ data: {} })
    }

    return Response.json(config)
  } catch (error) {
    console.error('Erro ao buscar config:', error)
    return Response.json({ error: 'Erro ao buscar configuração' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()

    let config = await prisma.configAutomacao.findFirst()

    if (!config) {
      config = await prisma.configAutomacao.create({ data: {} })
    }

    const updated = await prisma.configAutomacao.update({
      where: { id: config.id },
      data: {
        diasLembreteTroca: body.diasLembreteTroca,
        diasAvisoDebito: body.diasAvisoDebito,
        msgLembreteTroca: body.msgLembreteTroca,
        msgDebitoPendente: body.msgDebitoPendente,
        msgPronto: body.msgPronto,
        msgAniversario: body.msgAniversario,
        ativo: body.ativo,
      },
    })

    return Response.json(updated)
  } catch (error) {
    console.error('Erro ao atualizar config:', error)
    return Response.json({ error: 'Erro ao atualizar configuração' }, { status: 500 })
  }
}
