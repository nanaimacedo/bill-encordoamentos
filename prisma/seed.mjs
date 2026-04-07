import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const adapter = new PrismaBetterSqlite3({ url: 'file:dev.db' })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // Cordas
  const cordas = await Promise.all([
    prisma.corda.create({
      data: {
        nome: 'RPM Blast',
        marca: 'Babolat',
        tipo: 'monofilamento',
        calibre: '1.25',
        preco: 45,
        descricao: 'Corda de poliéster com spin extremo',
        beneficios: 'Máximo spin, controle, durabilidade',
        estoque: 20,
      },
    }),
    prisma.corda.create({
      data: {
        nome: 'ALU Power',
        marca: 'Luxilon',
        tipo: 'monofilamento',
        calibre: '1.25',
        preco: 55,
        descricao: 'Corda premium de poliéster',
        beneficios: 'Potência controlada, sensação única, usada por profissionais',
        estoque: 15,
      },
    }),
    prisma.corda.create({
      data: {
        nome: 'NXT',
        marca: 'Wilson',
        tipo: 'multifilamento',
        calibre: '1.30',
        preco: 50,
        descricao: 'Multifilamento premium para conforto',
        beneficios: 'Máximo conforto, potência natural, ideal para braço sensível',
        estoque: 10,
      },
    }),
    prisma.corda.create({
      data: {
        nome: 'Hawk',
        marca: 'Head',
        tipo: 'monofilamento',
        calibre: '1.25',
        preco: 35,
        descricao: 'Poliéster com bom custo-benefício',
        beneficios: 'Durabilidade, controle, preço acessível',
        estoque: 25,
      },
    }),
    prisma.corda.create({
      data: {
        nome: 'X-One Biphase',
        marca: 'Tecnifibre',
        tipo: 'multifilamento',
        calibre: '1.30',
        preco: 60,
        descricao: 'Multifilamento de alto desempenho',
        beneficios: 'Potência, conforto, manutenção de tensão',
        estoque: 8,
      },
    }),
  ])

  // Produtos
  await Promise.all([
    prisma.produto.create({
      data: { nome: 'Super Comp', categoria: 'overgrip', preco: 15, descricao: 'Overgrip Wilson', beneficios: 'Absorção de suor, aderência', estoque: 50 },
    }),
    prisma.produto.create({
      data: { nome: 'Pro Overgrip', categoria: 'overgrip', preco: 18, descricao: 'Overgrip Babolat', beneficios: 'Tacky, durável', estoque: 40 },
    }),
    prisma.produto.create({
      data: { nome: 'Vibrastop', categoria: 'acessorio', preco: 10, descricao: 'Antivibrador', beneficios: 'Reduz vibração', estoque: 30 },
    }),
  ])

  // Clientes
  const clientes = await Promise.all([
    prisma.cliente.create({
      data: { nome: 'João Silva', telefone: '(11) 99999-1234', condominio: 'Riviera', apartamento: '101' },
    }),
    prisma.cliente.create({
      data: { nome: 'Maria Santos', telefone: '(11) 98888-5678', condominio: 'Alphaville', apartamento: '302' },
    }),
    prisma.cliente.create({
      data: { nome: 'Carlos Oliveira', telefone: '(11) 97777-9012' },
    }),
    prisma.cliente.create({
      data: { nome: 'Ana Costa', telefone: '(11) 96666-3456', condominio: 'Riviera', apartamento: '205' },
    }),
    prisma.cliente.create({
      data: { nome: 'Pedro Mendes', telefone: '(11) 95555-7890' },
    }),
  ])

  // Encordoamentos com pagamentos
  const now = new Date()
  const encordoamentos = [
    { clienteIdx: 0, cordaIdx: 0, tensao: 55, preco: 45, status: 'entregue', pago: true, daysAgo: 45 },
    { clienteIdx: 0, cordaIdx: 0, tensao: 55, preco: 45, status: 'entregue', pago: true, daysAgo: 15 },
    { clienteIdx: 0, cordaIdx: 1, tensao: 54, preco: 55, status: 'pronto', pago: false, daysAgo: 1 },
    { clienteIdx: 1, cordaIdx: 2, tensao: 52, preco: 50, status: 'entregue', pago: true, daysAgo: 30 },
    { clienteIdx: 1, cordaIdx: 2, tensao: 52, preco: 50, status: 'pronto', pago: false, daysAgo: 2 },
    { clienteIdx: 2, cordaIdx: 3, tensao: 56, preco: 35, status: 'entregue', pago: true, daysAgo: 20 },
    { clienteIdx: 2, cordaIdx: 3, tensao: 56, preco: 35, status: 'em_andamento', pago: false, daysAgo: 0 },
    { clienteIdx: 3, cordaIdx: 4, tensao: 50, preco: 60, status: 'entregue', pago: false, daysAgo: 10 },
    { clienteIdx: 4, cordaIdx: 0, tensao: 58, preco: 45, status: 'entregue', pago: true, daysAgo: 5 },
    { clienteIdx: 4, cordaIdx: 1, tensao: 57, preco: 55, status: 'pendente', pago: false, daysAgo: 0 },
  ]

  for (const enc of encordoamentos) {
    const createdAt = new Date(now.getTime() - enc.daysAgo * 24 * 60 * 60 * 1000)
    const encordoamento = await prisma.encordoamento.create({
      data: {
        clienteId: clientes[enc.clienteIdx].id,
        cordaId: cordas[enc.cordaIdx].id,
        tensao: enc.tensao,
        preco: enc.preco,
        status: enc.status,
        createdAt,
      },
    })

    await prisma.pagamento.create({
      data: {
        clienteId: clientes[enc.clienteIdx].id,
        encordoamentoId: encordoamento.id,
        valor: enc.preco,
        status: enc.pago ? 'pago' : 'pendente',
        formaPagamento: enc.pago ? 'pix' : '',
        dataPagamento: enc.pago ? createdAt : null,
        createdAt,
      },
    })
  }

  // Conteúdo educativo
  await Promise.all([
    prisma.conteudoEducativo.create({
      data: {
        titulo: 'Como escolher a corda ideal para seu jogo',
        categoria: 'cordas',
        resumo: 'Guia completo para escolher entre monofilamento, multifilamento e natural',
        conteudo: `A escolha da corda é fundamental para o desempenho no tênis.

MONOFILAMENTO (Poliéster):
- Ideal para jogadores que geram muito spin
- Maior durabilidade
- Menos conforto, mais controle
- Exemplos: RPM Blast, ALU Power, Hawk

MULTIFILAMENTO:
- Máximo conforto e potência
- Ideal para jogadores com braço sensível
- Menor durabilidade
- Exemplos: NXT, X-One Biphase

NATURAL (Tripa):
- Melhor sensação e potência
- Manutenção de tensão superior
- Preço mais elevado`,
      },
    }),
    prisma.conteudoEducativo.create({
      data: {
        titulo: 'Tensão da corda: o que muda no jogo?',
        categoria: 'tensoes',
        resumo: 'Entenda como a tensão afeta potência, controle e spin',
        conteudo: `TENSÃO BAIXA (48-52 lbs): Mais potência, efeito trampolim
TENSÃO MÉDIA (53-57 lbs): Equilíbrio, mais versátil
TENSÃO ALTA (58-62 lbs): Mais controle e precisão

DICA: Comece com tensão média e ajuste conforme necessidade.`,
      },
    }),
    prisma.conteudoEducativo.create({
      data: {
        titulo: '5 dicas para melhorar seu saque',
        categoria: 'dicas',
        resumo: 'Técnicas práticas para um saque mais eficiente',
        conteudo: `1. Posicionamento dos pés na largura dos ombros
2. Lançamento da bola com braço estendido
3. Pronação do pulso para potência e spin
4. Acompanhamento completo do movimento
5. Desenvolva uma rotina consistente`,
      },
    }),
  ])

  // Mensagens
  await Promise.all([
    prisma.mensagem.create({
      data: { autor: 'Loja', conteudo: 'Bem-vindos ao grupo! Troquem ideia sobre tênis aqui.', canal: 'geral' },
    }),
    prisma.mensagem.create({
      data: { autor: 'João Silva', conteudo: 'Alguém quer bater bola sábado?', canal: 'jogos', clienteId: clientes[0].id },
    }),
    prisma.mensagem.create({
      data: { autor: 'Maria Santos', conteudo: 'Eu topo! Que horas?', canal: 'jogos', clienteId: clientes[1].id },
    }),
    prisma.mensagem.create({
      data: { autor: 'Loja', conteudo: 'Promoção: 10% de desconto em cordas Babolat essa semana!', canal: 'geral' },
    }),
  ])

  console.log('Seed completed!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
