import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const canal = searchParams.get('canal')

    const mensagens = await prisma.mensagem.findMany({
      where: canal ? { canal } : undefined,
      orderBy: { createdAt: 'desc' },
    })

    return Response.json(mensagens)
  } catch (error) {
    console.error('Erro ao listar mensagens:', error)
    return Response.json({ error: 'Erro ao listar mensagens' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const mensagem = await prisma.mensagem.create({
      data: body,
    })

    return Response.json(mensagem, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar mensagem:', error)
    return Response.json({ error: 'Erro ao criar mensagem' }, { status: 500 })
  }
}
