/* Imported by the PWA worker. The server schedules pushes; no page timers. */
self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data?.json() || {} } catch { /* Always show a visible fallback for an empty push. */ }
  const body = data.kind === 'nianfo' ? '念一声佛号，愿您心安。' : data.kind === 'huiguang' ? '做一次一念回光，回到当下。' : '记得念佛，也记得一念回光。'
  event.waitUntil(self.registration.showNotification('宽心纪 · 每日提醒', {
    body,
    icon: '/kuanxin-logo.png',
    tag: typeof data.tag === 'string' ? data.tag : 'kuanxin-daily-reminder',
    data: { url: '/#/' },
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const existing = windows.find((client) => new URL(client.url).origin === self.location.origin)
    if (existing) { await existing.navigate('/#/'); await existing.focus() }
    else await self.clients.openWindow('/#/')
  })())
})
