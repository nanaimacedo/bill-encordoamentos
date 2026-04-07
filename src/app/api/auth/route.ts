export async function POST(request: Request) {
  const { pin } = await request.json()
  const correctPin = process.env.ADMIN_PIN || '1234'
  if (pin === correctPin) {
    return Response.json({ success: true })
  }
  return Response.json({ success: false, error: 'PIN incorreto' }, { status: 401 })
}
