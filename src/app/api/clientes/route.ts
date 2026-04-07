import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')

    const clientes = await prisma.cliente.findMany({
      where: q
        ? {
            OR: [
              { nome: { contains: q, mode: 'insensitive' as const } },
              { telefone: { contains: q } },
            ],
          }
        : undefined,
      orderBy: { nome: 'asc' },
      include: {
        _count: { select: { encordoamentos: true } },
      },
    })

    return Response.json(clientes)
  } catch (error) {
    console.error('Erro ao listar clientes:', error)
    return Response.json({ error: 'Erro ao listar clientes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const cliente = await prisma.cliente.create({
      data: {
        nome: body.nome,
        telefone: body.telefone,
        condominio: body.condominio || null,
        apartamento: body.apartamento || null,
        email: body.email || null,
        centroReceita: body.centroReceita || 'loja',
        dataNascimento: body.dataNascimento ? new Date(body.dataNascimento) : null,
      },
    })

    return Response.json(cliente, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar cliente:', error)
    return Response.json({ error: 'Erro ao criar cliente' }, { status: 500 })
  }
}
