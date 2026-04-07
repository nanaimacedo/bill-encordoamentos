import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const config = await prisma.configAutomacao.findFirst()
    if (!config || !config.ativo) {
      return Response.json({ created: 0, lembretes: 0, debitos: 0, aniversarios: 0, message: 'Automações desativadas' })
    }

    const agora = new Date()
    const vinteQuatroHorasAtras = new Date(agora.getTime() - 24 * 60 * 60 * 1000)

    let lembretes = 0
    let debitos = 0
    let aniversarios = 0

    // --- Lembretes de troca ---
    const limiteData = new Date(agora.getTime() - config.diasLembreteTroca * 24 * 60 * 60 * 1000)

    const clientesComEncordoamento = await prisma.cliente.findMany({
      include: {
        encordoamentos: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })

    for (const cliente of clientesComEncordoamento) {
      if (cliente.encordoamentos.length === 0) continue
      const ultimo = cliente.encordoamentos[0]
      if (new Date(ultimo.createdAt) > limiteData) continue

      const duplicata = await prisma.notificacao.findFirst({
        where: {
          clienteId: cliente.id,
          tipo: 'lembrete_troca',
          createdAt: { gte: vinteQuatroHorasAtras },
        },
      })
      if (duplicata) continue

      const dias = Math.floor((agora.getTime() - new Date(ultimo.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      const mensagem = config.msgLembreteTroca
        .replace('{nome}', cliente.nome)
        .replace('{dias}', String(dias))

      await prisma.notificacao.create({
        data: {
          clienteId: cliente.id,
          tipo: 'lembrete_troca',
          titulo: 'Lembrete de Troca de Corda',
          mensagem,
        },
      })
      lembretes++
    }

    // --- Débitos pendentes ---
    const limiteDebito = new Date(agora.getTime() - config.diasAvisoDebito * 24 * 60 * 60 * 1000)

    const pagamentosPendentes = await prisma.pagamento.findMany({
      where: {
        status: 'pendente',
        createdAt: { lte: limiteDebito },
      },
      include: { cliente: true },
    })

    for (const pag of pagamentosPendentes) {
      const duplicata = await prisma.notificacao.findFirst({
        where: {
          clienteId: pag.clienteId,
          tipo: 'debito_pendente',
          createdAt: { gte: vinteQuatroHorasAtras },
        },
      })
      if (duplicata) continue

      const mensagem = config.msgDebitoPendente
        .replace('{nome}', pag.cliente.nome)
        .replace('{valor}', `R$ ${pag.valor.toFixed(2)}`)

      await prisma.notificacao.create({
        data: {
          clienteId: pag.clienteId,
          tipo: 'debito_pendente',
          titulo: 'Débito Pendente',
          mensagem,
        },
      })
      debitos++
    }

    // --- Aniversários ---
    const hoje = new Date()
    const mesHoje = hoje.getMonth() + 1
    const diaHoje = hoje.getDate()

    const todosClientes = await prisma.cliente.findMany({
      where: { dataNascimento: { not: null } },
    })

    for (const cliente of todosClientes) {
      if (!cliente.dataNascimento) continue
      const dn = new Date(cliente.dataNascimento)
      if (dn.getMonth() + 1 !== mesHoje || dn.getDate() !== diaHoje) continue

      const duplicata = await prisma.notificacao.findFirst({
        where: {
          clienteId: cliente.id,
          tipo: 'aniversario',
          createdAt: { gte: vinteQuatroHorasAtras },
        },
      })
      if (duplicata) continue

      const mensagem = config.msgAniversario.replace('{nome}', cliente.nome)

      await prisma.notificacao.create({
        data: {
          clienteId: cliente.id,
          tipo: 'aniversario',
          titulo: 'Feliz Aniversário!',
          mensagem,
        },
      })
      aniversarios++
    }

    const created = lembretes + debitos + aniversarios
    return Response.json({ created, lembretes, debitos, aniversarios })
  } catch (error) {
    console.error('Erro ao executar automações:', error)
    return Response.json({ error: 'Erro ao executar automações' }, { status: 500 })
  }
}
