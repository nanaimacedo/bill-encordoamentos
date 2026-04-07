import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get('clienteId')

    if (!clienteId) {
      return Response.json({ error: 'clienteId obrigatorio' }, { status: 400 })
    }

    const perfil = await prisma.perfilJogador.findUnique({
      where: { clienteId },
      include: { cliente: true },
    })

    if (!perfil) {
      return Response.json(null)
    }

    return Response.json(perfil)
  } catch (error) {
    console.error('Erro ao buscar perfil:', error)
    return Response.json({ error: 'Erro ao buscar perfil' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const perfil = await prisma.perfilJogador.upsert({
      where: { clienteId: body.clienteId },
      update: {
        nivel: body.nivel,
        estiloJogo: body.estiloJogo || '',
        maoHabil: body.maoHabil || 'direita',
        disponibilidade: body.disponibilidade || '',
        regiao: body.regiao || '',
        bio: body.bio || '',
      },
      create: {
        clienteId: body.clienteId,
        nivel: body.nivel || 'iniciante',
        estiloJogo: body.estiloJogo || '',
        maoHabil: body.maoHabil || 'direita',
        disponibilidade: body.disponibilidade || '',
        regiao: body.regiao || '',
        bio: body.bio || '',
      },
      include: { cliente: true },
    })

    return Response.json(perfil, { status: 201 })
  } catch (error) {
    console.error('Erro ao salvar perfil:', error)
    return Response.json({ error: 'Erro ao salvar perfil' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()

    const perfil = await prisma.perfilJogador.upsert({
      where: { clienteId: body.clienteId },
      update: {
        nivel: body.nivel,
        estiloJogo: body.estiloJogo || '',
        maoHabil: body.maoHabil || 'direita',
        disponibilidade: body.disponibilidade || '',
        regiao: body.regiao || '',
        bio: body.bio || '',
      },
      create: {
        clienteId: body.clienteId,
        nivel: body.nivel || 'iniciante',
        estiloJogo: body.estiloJogo || '',
        maoHabil: body.maoHabil || 'direita',
        disponibilidade: body.disponibilidade || '',
        regiao: body.regiao || '',
        bio: body.bio || '',
      },
      include: { cliente: true },
    })

    return Response.json(perfil)
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error)
    return Response.json({ error: 'Erro ao atualizar perfil' }, { status: 500 })
  }
}
