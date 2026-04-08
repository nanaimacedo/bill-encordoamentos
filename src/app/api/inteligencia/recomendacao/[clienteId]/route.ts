import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ clienteId: string }> }
) {
  try {
    const { clienteId } = await params

    // Get client profile
    const perfil = await prisma.perfilJogador.findUnique({
      where: { clienteId },
    })

    // Get client's encordoamento history with corda details
    const historico = await prisma.encordoamento.findMany({
      where: { clienteId },
      include: { corda: true },
      orderBy: { createdAt: 'desc' },
    })

    // Count usage per corda
    const usoPorCorda: Record<string, number> = {}
    for (const enc of historico) {
      if (enc.cordaId) {
        usoPorCorda[enc.cordaId] = (usoPorCorda[enc.cordaId] || 0) + 1
      }
    }

    // Determine recommendation criteria
    const nivel = perfil?.nivel || 'iniciante'
    const estilo = perfil?.estiloJogo || ''

    let tipoRecomendado: string
    let motivo: string

    if (nivel === 'iniciante' || estilo === 'defensivo') {
      tipoRecomendado = 'multifilamento'
      motivo =
        nivel === 'iniciante'
          ? 'Multifilamento oferece mais conforto e potência, ideal para iniciantes'
          : 'Multifilamento proporciona conforto e absorção de impacto para jogo defensivo'
    } else if (
      nivel === 'avancado' ||
      nivel === 'profissional' ||
      estilo === 'agressivo'
    ) {
      tipoRecomendado = 'monofilamento'
      motivo =
        estilo === 'agressivo'
          ? 'Monofilamento oferece mais spin e controle para jogo agressivo'
          : 'Monofilamento proporciona durabilidade e controle para jogadores avançados'
    } else {
      // intermediario - check history or balanced
      const cordaIds = Object.entries(usoPorCorda)
        .sort((a, b) => b[1] - a[1])
        .map(([id]) => id)

      if (cordaIds.length > 0) {
        const cordaMaisUsada = historico.find(
          (e) => e.cordaId === cordaIds[0]
        )?.corda
        tipoRecomendado = cordaMaisUsada?.tipo || 'multifilamento'
        motivo = `Baseado no seu histórico de uso (${cordaMaisUsada?.nome || 'preferida'}), recomendamos cordas similares`
      } else {
        tipoRecomendado = 'multifilamento'
        motivo =
          'Para nível intermediário sem histórico, recomendamos multifilamento como opção equilibrada'
      }
    }

    // Get recommended cordas
    const cordasRecomendadas = await prisma.corda.findMany({
      where: {
        ativa: true,
        tipo: { contains: tipoRecomendado },
      },
      orderBy: { nome: 'asc' },
    })

    // If no cordas match the type, get all active cordas
    const cordas =
      cordasRecomendadas.length > 0
        ? cordasRecomendadas
        : await prisma.corda.findMany({
            where: { ativa: true },
            orderBy: { nome: 'asc' },
          })

    // Get average rating for each corda
    const recomendacoes = await Promise.all(
      cordas.map(async (corda) => {
        const avaliacoes = await prisma.avaliacao.findMany({
          where: { cordaId: corda.id },
        })
        const mediaAvaliacoes =
          avaliacoes.length > 0
            ? avaliacoes.reduce((sum, a) => sum + a.nota, 0) / avaliacoes.length
            : 0

        return {
          corda,
          motivo:
            cordasRecomendadas.length > 0
              ? motivo
              : 'Recomendação geral - nenhuma corda do tipo ideal disponível',
          mediaAvaliacoes: Math.round(mediaAvaliacoes * 10) / 10,
          totalAvaliacoes: avaliacoes.length,
        }
      })
    )

    const perfilResumo = perfil
      ? `Nível: ${perfil.nivel} | Estilo: ${perfil.estiloJogo || 'não definido'} | Mão: ${perfil.maoHabil}`
      : 'Perfil não cadastrado'

    return Response.json({ recomendacoes, perfilResumo })
  } catch (error) {
    console.error('Erro ao gerar recomendações:', error)
    return Response.json(
      { error: 'Erro ao gerar recomendações' },
      { status: 500 }
    )
  }
}
