export const VAPID_PUBLIC_KEY = 'BLcuQSLvrc8rHK4snSVOn-MeHBNGNIW9FuY7ld0e4d-18V9RZQJybddQDRbyo7VugXWIzakjoaPQ6ARr_bUa77I'

export async function registerPushSubscription(clienteId: string) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null

  const registration = await navigator.serviceWorker.register('/sw.js')
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  })

  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clienteId,
      subscription: subscription.toJSON(),
    }),
  })

  return subscription
}

export async function registerAdminPushSubscription() {
  if (typeof window === 'undefined') return { success: false, error: 'Não suportado' }
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { success: false, error: 'Navegador não suporta notificações push' }
  }

  try {
    // Pedir permissão
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      return { success: false, error: 'Permissão negada' }
    }

    // Registrar SW
    const registration = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready

    // Reutilizar subscription existente ou criar nova
    let subscription = await registration.pushManager.getSubscription()
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
    }

    // Enviar ao backend
    const res = await fetch('/api/push/admin-subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: subscription.toJSON() }),
    })

    if (!res.ok) throw new Error('Falha ao registrar')
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function unregisterAdminPushSubscription() {
  if (typeof window === 'undefined') return { success: false }
  try {
    const registration = await navigator.serviceWorker.getRegistration('/sw.js')
    const subscription = await registration?.pushManager.getSubscription()
    if (subscription) {
      await fetch('/api/push/admin-subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      })
      await subscription.unsubscribe()
    }
    return { success: true }
  } catch {
    return { success: false }
  }
}

export async function getAdminPushStatus(): Promise<{ ativo: boolean }> {
  if (typeof window === 'undefined') return { ativo: false }
  try {
    const registration = await navigator.serviceWorker.getRegistration('/sw.js')
    const subscription = await registration?.pushManager.getSubscription()
    return { ativo: !!subscription }
  } catch {
    return { ativo: false }
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)))
}
