import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const cordas = await prisma.corda.findMany({
      where: { ativa: true },
      orderBy: { nome: 'asc' },
    })

    return Response.json(cordas)
  } catch (error) {
    console.error('Erro ao listar cordas:', error)
    return Response.json({ error: 'Erro ao listar cordas' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const corda = await prisma.corda.create({
      data: body,
    })

    return Response.json(corda, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar corda:', error)
    return Response.json({ error: 'Erro ao criar corda' }, { status: 500 })
  }
}
