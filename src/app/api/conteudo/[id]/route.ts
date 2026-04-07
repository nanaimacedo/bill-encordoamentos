import { prisma } from '@/lib/prisma'

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params

    const conteudo = await prisma.conteudoEducativo.findUnique({
      where: { id },
    })

    if (!conteudo) {
      return Response.json({ error: 'Conteudo nao encontrado' }, { status: 404 })
    }

    return Response.json(conteudo)
  } catch (error) {
    console.error('Erro ao buscar conteudo:', error)
    return Response.json({ error: 'Erro ao buscar conteudo' }, { status: 500 })
  }
}
