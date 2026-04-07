import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { nome, endereco, latitude, longitude, raio, ativo } = body

    const local = await prisma.local.update({
      where: { id },
      data: {
        ...(nome !== undefined && { nome }),
        ...(endereco !== undefined && { endereco }),
        ...(latitude !== undefined && { latitude: parseFloat(latitude) }),
        ...(longitude !== undefined && { longitude: parseFloat(longitude) }),
        ...(raio !== undefined && { raio: parseInt(raio) }),
        ...(ativo !== undefined && { ativo }),
      },
    })

    return Response.json(local)
  } catch (error) {
    console.error('Erro ao atualizar local:', error)
    return Response.json({ error: 'Erro ao atualizar local' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.local.delete({ where: { id } })
    return Response.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar local:', error)
    return Response.json({ error: 'Erro ao deletar local' }, { status: 500 })
  }
}
