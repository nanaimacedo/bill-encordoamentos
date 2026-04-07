import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const locais = await prisma.local.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return Response.json(locais)
  } catch (error) {
    console.error('Erro ao buscar locais:', error)
    return Response.json({ error: 'Erro ao buscar locais' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nome, endereco, latitude, longitude, raio } = body

    if (!nome || latitude === undefined || longitude === undefined) {
      return Response.json(
        { error: 'Nome, latitude e longitude são obrigatórios' },
        { status: 400 }
      )
    }

    const local = await prisma.local.create({
      data: {
        nome,
        endereco: endereco || '',
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        raio: raio ? parseInt(raio) : 500,
      },
    })

    return Response.json(local, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar local:', error)
    return Response.json({ error: 'Erro ao criar local' }, { status: 500 })
  }
}
