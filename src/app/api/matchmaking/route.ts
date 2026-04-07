import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get('clienteId')

    if (!clienteId) {
      return Response.json({ error: 'clienteId obrigatorio' }, { status: 400 })
    }

    const meuPerfil = await prisma.perfilJogador.findUnique({
      where: { clienteId },
    })

    if (!meuPerfil) {
      return Response.json({ error: 'Perfil nao encontrado. Crie seu perfil primeiro.' }, { status: 404 })
    }

    const compatíveis = await prisma.perfilJogador.findMany({
      where: {
        AND: [
          { clienteId: { not: clienteId } },
          { nivel: meuPerfil.nivel },
          ...(meuPerfil.regiao ? [{ regiao: meuPerfil.regiao }] : []),
        ],
      },
      include: {
        cliente: {
          select: { id: true, nome: true, telefone: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return Response.json(compatíveis)
  } catch (error) {
    console.error('Erro no matchmaking:', error)
    return Response.json({ error: 'Erro no matchmaking' }, { status: 500 })
  }
}
