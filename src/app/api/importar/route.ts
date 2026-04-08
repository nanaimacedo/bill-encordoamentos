import { prisma } from '@/lib/prisma'

// Dados da planilha de abril/2026
const VENDAS_PLANILHA = [
  { cliente: 'Alexandre Valegio', data: '2026-04-01', valor: 318, produto: 'rpm', raquetes: 2 },
  { cliente: 'Fernando Henrique', data: '2026-04-01', valor: 756, produto: 'Tour bite', raquetes: 4 },
  { cliente: 'Aldo', data: '2026-04-01', valor: 45, produto: 'm.o', raquetes: 1 },
  { cliente: 'André Guedes', data: '2026-04-01', valor: 140, produto: 'Pts', raquetes: 1 },
  { cliente: 'Tony', data: '2026-04-01', valor: 75, produto: 'Zons Hexplosion', raquetes: 1 },
  { cliente: 'Laércio', data: '2026-04-01', valor: 50, produto: 'm.o', raquetes: 1 },
  { cliente: 'André da Col', data: '2026-04-01', valor: 165, produto: 'sens e grip', raquetes: 1 },
  { cliente: 'Michel Vitalis', data: '2026-04-01', valor: 155, produto: 'Zons Max', raquetes: 1 },
  { cliente: 'Rafa Steve', data: '2026-04-01', valor: 45, produto: 'm.o', raquetes: 1 },
  { cliente: 'Rafa', data: '2026-04-01', valor: 100, produto: 'M.o + Wilson Pro', raquetes: 1, obs: 'suima corda e Grips' },
  { cliente: 'Milton', data: '2026-04-01', valor: 155, produto: 'max', raquetes: 1, obs: 'tratante' },
  { cliente: 'Steve', data: '2026-04-01', valor: 0, produto: 'm.o', raquetes: 1 },
  { cliente: 'Karen', data: '2026-04-02', valor: 30, produto: 'Overgrip Yonex', raquetes: 0 },
  { cliente: 'Torneio', data: '2026-04-02', valor: 30, produto: 'Antivibrador Silent', raquetes: 0 },
  { cliente: 'Torneio', data: '2026-04-02', valor: 78, produto: 'Antivibrador Yonex', raquetes: 0 },
  { cliente: 'Sueli Wu', data: '2026-04-02', valor: 50, produto: 'm.o', raquetes: 1 },
  { cliente: 'Torneio', data: '2026-04-02', valor: 249, produto: 'Cushion Yonex Couro Premium', raquetes: 0 },
  { cliente: 'Sandra Yakabe', data: '2026-04-02', valor: 377, produto: 'Luxilon Element / ptp', raquetes: 3 },
  { cliente: 'Torneio', data: '2026-04-02', valor: 100, produto: 'Zons Hexplosion', raquetes: 1, obs: 'zons' },
  { cliente: 'Torneio', data: '2026-04-02', valor: 199, produto: 'Confidential', raquetes: 1, obs: 'confi' },
  { cliente: 'Torneio', data: '2026-04-02', valor: 79, produto: 'Grip Yonex Cartela', raquetes: 0, obs: 'grips 79,00' },
  { cliente: 'Torneio', data: '2026-04-02', valor: 40, produto: 'M.o', raquetes: 1, obs: 'm.o' },
  { cliente: 'Bob', data: '2026-04-02', valor: 40, produto: 'M.o', raquetes: 1, obs: 'm.o' },
  { cliente: 'Torneio', data: '2026-04-02', valor: 139, produto: 'Boné Yonex', raquetes: 0 },
  { cliente: 'Takeshi', data: '2026-04-02', valor: 600, produto: 'grips pack c/30', raquetes: 0 },
  { cliente: 'Gu Tsukada', data: '2026-04-02', valor: 40, produto: 'm.o', raquetes: 1 },
  { cliente: 'Daniel Hira', data: '2026-04-02', valor: 40, produto: 'm.o', raquetes: 1 },
  { cliente: 'Ale Yana', data: '2026-04-02', valor: 40, produto: 'm.o', raquetes: 1 },
  { cliente: 'Torneio', data: '2026-04-02', valor: 110, produto: 'hexp', raquetes: 1 },
  { cliente: 'Torneio', data: '2026-04-02', valor: 100, produto: 'hexp', raquetes: 1 },
  { cliente: 'Torneio', data: '2026-04-02', valor: 40, produto: 'm.o', raquetes: 1 },
  { cliente: 'Flávio Tomy', data: '2026-04-02', valor: 75, produto: 'm.o grip', raquetes: 1 },
  { cliente: 'Torneio', data: '2026-04-02', valor: 248, produto: 'munh nike', raquetes: 0 },
  { cliente: 'Torneio', data: '2026-04-02', valor: 90, produto: 'bandana', raquetes: 0 },
  { cliente: 'Torneio', data: '2026-04-02', valor: 89, produto: 'cartela', raquetes: 0 },
  { cliente: 'Torneio', data: '2026-04-02', valor: 139, produto: 'mun nike', raquetes: 0 },
  { cliente: 'Torneio', data: '2026-04-02', valor: 79, produto: 'grip y', raquetes: 0 },
  { cliente: 'Torneio', data: '2026-04-02', valor: 139, produto: 'bone y', raquetes: 0 },
  { cliente: 'Torneio', data: '2026-04-02', valor: 274, produto: 'multi feel', raquetes: 1 },
  { cliente: 'Nity', data: '2026-04-02', valor: 110, produto: 'hexp', raquetes: 1 },
  { cliente: 'Torneio', data: '2026-04-02', valor: 79, produto: 'grip', raquetes: 0 },
  { cliente: 'Torneio', data: '2026-04-02', valor: 139, produto: 'bone y', raquetes: 0 },
  { cliente: 'Lucia', data: '2026-04-03', valor: 2539, produto: 'raquete ezone', raquetes: 1, obs: 'torneio' },
  { cliente: 'Torneio', data: '2026-04-03', valor: 79, produto: 'grips', raquetes: 0 },
  { cliente: 'Torneio', data: '2026-04-03', valor: 55, produto: 'meia w', raquetes: 0 },
  { cliente: 'Nicolas Kanashiro', data: '2026-04-03', valor: 145, produto: 'pts', raquetes: 1 },
  { cliente: 'Torneio', data: '2026-04-03', valor: 119, produto: 'tornado', raquetes: 1 },
  { cliente: 'Rafa Yoshioka', data: '2026-04-03', valor: 264, produto: 'g bola wil', raquetes: 1 },
  { cliente: 'Torneio', data: '2026-04-03', valor: 40, produto: 'm.o', raquetes: 1 },
  { cliente: 'Torneio', data: '2026-04-03', valor: 249, produto: 'grips', raquetes: 0 },
  { cliente: 'Torneio', data: '2026-04-03', valor: 40, produto: 'm.o', raquetes: 1, obs: 'm.o' },
  { cliente: 'Torneio', data: '2026-04-03', valor: 100, produto: 'hexo', raquetes: 1, obs: 'hexp' },
  { cliente: 'Torneio', data: '2026-04-03', valor: 145, produto: 'pts', raquetes: 1, obs: 'PTs' },
  { cliente: 'Torneio', data: '2026-04-03', valor: 447, produto: 'bola fort', raquetes: 0 },
  { cliente: 'Torneio', data: '2026-04-03', valor: 249, produto: 'cushion yonex', raquetes: 0 },
  { cliente: 'Torneio', data: '2026-04-03', valor: 470, produto: 'comissao', raquetes: 0, obs: 'comissão' },
  { cliente: 'Torneio', data: '2026-04-03', valor: 79, produto: 'grips', raquetes: 0 },
  { cliente: 'Torneio', data: '2026-04-03', valor: 139, produto: 'bone y', raquetes: 1 },
  { cliente: 'Torneio', data: '2026-04-03', valor: 670, produto: 'mochila y', raquetes: 0 },
  { cliente: 'Torneio', data: '2026-04-03', valor: 250, produto: 'fita e corda', raquetes: 0, obs: 'Passada de corda, fita protetora' },
  { cliente: 'Torneio', data: '2026-04-03', valor: 100, produto: 'hexp', raquetes: 1 },
  { cliente: 'Torneio', data: '2026-04-03', valor: 75, produto: 'yonex', raquetes: 1 },
  { cliente: 'Ju Yanazi', data: '2026-04-03', valor: 315, produto: 'hexp', raquetes: 2 },
  { cliente: 'Torneio', data: '2026-04-03', valor: 169, produto: 'adrenaline', raquetes: 1 },
  { cliente: 'Torneio', data: '2026-04-03', valor: 105, produto: 'mista', raquetes: 1 },
  { cliente: 'Torneio', data: '2026-04-03', valor: 348, produto: '4g fita', raquetes: 1 },
  { cliente: 'Rafa Yoshioka', data: '2026-04-04', valor: 2805, produto: 'vcore corda anti e grips', raquetes: 1, obs: '2785' },
  { cliente: 'Torneio', data: '2026-04-04', valor: 145, produto: 'pts', raquetes: 1 },
  { cliente: 'Torneio', data: '2026-04-04', valor: 155, produto: 'max', raquetes: 1 },
  { cliente: 'Torneio', data: '2026-04-04', valor: 175, produto: 'pts e grips', raquetes: 1 },
  { cliente: 'Torneio', data: '2026-04-04', valor: 270, produto: 'g e grips', raquetes: 1 },
  { cliente: 'Torneio', data: '2026-04-04', valor: 49, produto: 'anti', raquetes: 0 },
  { cliente: 'Torneio', data: '2026-04-04', valor: 127, produto: 'munh y', raquetes: 0 },
  { cliente: 'Torneio', data: '2026-04-04', valor: 75, produto: 'munh y', raquetes: 0 },
  { cliente: 'Torneio', data: '2026-04-04', valor: 79, produto: 'grips', raquetes: 0 },
  { cliente: 'Marcus Kanashiro', data: '2026-04-04', valor: 135, produto: 'sens', raquetes: 1 },
  { cliente: 'Torneio', data: '2026-04-04', valor: 244, produto: 'munh nike munh y', raquetes: 0 },
  { cliente: 'Luiz CPB', data: '2026-04-04', valor: 169, produto: 'ptr', raquetes: 1 },
  { cliente: 'Dr Henry Sato', data: '2026-04-04', valor: 40, produto: 'm.o', raquetes: 1 },
  { cliente: 'Jaciara', data: '2026-04-05', valor: 69, produto: 'gut', raquetes: 1 },
  { cliente: 'Rogerio Passador Cooper', data: '2026-04-05', valor: 139, produto: 'grips', raquetes: 0 },
  { cliente: 'Marta Toita', data: '2026-04-05', valor: 155, produto: 'max', raquetes: 1 },
  { cliente: 'Mario Toita', data: '2026-04-05', valor: 119, produto: 'tornado', raquetes: 1 },
  { cliente: 'Ana Julia', data: '2026-04-05', valor: 269, produto: 'feel e grips', raquetes: 1 },
  { cliente: 'Ale Fujita Vitallis', data: '2026-04-05', valor: 90, produto: 'm.o', raquetes: 2 },
]

export async function POST(request: Request) {
  try {
    const { senha } = await request.json()
    if (senha !== 'importar2026') {
      return Response.json({ error: 'Senha incorreta' }, { status: 401 })
    }

    const resultados: string[] = []
    let importados = 0
    let erros = 0

    for (const venda of VENDAS_PLANILHA) {
      try {
        // 1. Buscar ou criar cliente
        let cliente = await prisma.cliente.findFirst({
          where: {
            nome: { contains: venda.cliente, mode: 'insensitive' },
          },
        })

        if (!cliente) {
          cliente = await prisma.cliente.create({
            data: {
              nome: venda.cliente,
              telefone: '',
              centroReceita: 'loja',
            },
          })
          resultados.push(`[NOVO CLIENTE] ${venda.cliente}`)
        }

        // 2. Determinar se é encordoamento (raquetes > 0) ou venda avulsa
        const isEncordoamento = venda.raquetes > 0
        const obsTexto = [
          venda.obs || '',
          `Produto: ${venda.produto}`,
          venda.raquetes > 1 ? `${venda.raquetes} raquetes` : '',
          !isEncordoamento ? 'Venda avulsa (produto)' : '',
          'Importado da planilha Abril/2026',
        ].filter(Boolean).join(' | ')

        // 3. Criar encordoamento com a data original
        const dataVenda = new Date(venda.data + 'T12:00:00.000Z')

        const encordoamento = await prisma.encordoamento.create({
          data: {
            clienteId: cliente.id,
            preco: venda.valor,
            tipo: 'padrao',
            status: 'concluido',
            entrega: 'retirada',
            centroReceita: 'loja',
            observacoes: obsTexto,
            createdAt: dataVenda,
          },
        })

        // 4. Criar pagamento como pago (já foram vendas realizadas)
        await prisma.pagamento.create({
          data: {
            clienteId: cliente.id,
            encordoamentoId: encordoamento.id,
            valor: venda.valor,
            status: 'pago',
            formaPagamento: 'importado',
            dataPagamento: dataVenda,
            createdAt: dataVenda,
          },
        })

        importados++
        resultados.push(`[OK] ${venda.cliente} - ${venda.produto} - R$${venda.valor} (${venda.data})`)
      } catch (err) {
        erros++
        resultados.push(`[ERRO] ${venda.cliente} - ${venda.produto}: ${err}`)
      }
    }

    return Response.json({
      sucesso: true,
      importados,
      erros,
      total: VENDAS_PLANILHA.length,
      valorTotal: VENDAS_PLANILHA.reduce((sum, v) => sum + v.valor, 0),
      resultados,
    })
  } catch (error) {
    console.error('Erro na importação:', error)
    return Response.json({ error: 'Erro na importação' }, { status: 500 })
  }
}
