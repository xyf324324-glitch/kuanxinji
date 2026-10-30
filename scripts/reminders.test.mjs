import { test, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { enableReminders, loadReminderConfig, normalizeTimes, updateReminderTimes, disableReminders } from '../src/lib/reminders.js'

const originalFetch = globalThis.fetch
afterEach(() => { globalThis.fetch = originalFetch })

test('default schedule preserves both morning/evening practices and midday reflection', () => {
  assert.deepEqual(normalizeTimes(null), { nianfo: ['09:00', '21:00'], huiguang: ['09:00', '13:00', '21:00'] })
  assert.deepEqual(normalizeTimes({ nianfo: ['21:00', '09:00', '09:00', '25:99'], huiguang: [] }), normalizeTimes(null))
})

test('static hosting HTML and disabled config cannot activate notifications', async () => {
  globalThis.fetch = async () => new Response('<html>SPA fallback</html>', { headers: { 'Content-Type': 'text/html' } })
  assert.equal(await loadReminderConfig(), null)
  globalThis.fetch = async () => Response.json({ ok: true, enabled: false, publicKey: 'A'.repeat(87) })
  assert.equal(await loadReminderConfig(), null)
})

test('missing backend does not request permission or create a push subscription', async () => {
  let permissionCalls = 0
  globalThis.window = { isSecureContext: true, Notification: {}, PushManager: {} }
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { userAgent: 'test', platform: 'test', serviceWorker: {} } })
  globalThis.Notification = { requestPermission: () => { permissionCalls++; return Promise.resolve('granted') } }
  await assert.rejects(enableReminders(null, normalizeTimes(null)), /暂未开放/)
  assert.equal(permissionCalls, 0)
})

test('a granted permission alone is not success; failed server registration rolls back the new subscription', async () => {
  let removed = 0
  const subscription = { toJSON: () => ({ endpoint: 'https://example.test/push' }), unsubscribe: async () => { removed++ } }
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: {
    userAgent: 'test', platform: 'test', serviceWorker: { getRegistration: async () => ({ active: {}, pushManager: { getSubscription: async () => null, subscribe: async () => subscription } }) },
  } })
  globalThis.fetch = async () => Response.json({ ok: true, enabled: false })
  await assert.rejects(enableReminders({ publicKey: 'A'.repeat(87) }, normalizeTimes(null)), /暂未开放/)
  assert.equal(removed, 1)
})

test('failed update or disable cannot falsely confirm a changed schedule', async () => {
  let removed = false
  const subscription = { toJSON: () => ({ endpoint: 'https://example.test/push' }), unsubscribe: async () => { removed = true } }
  globalThis.fetch = async () => new Response('unavailable', { status: 503 })
  await assert.rejects(updateReminderTimes(subscription, normalizeTimes(null)))
  await assert.rejects(disableReminders(subscription))
  assert.equal(removed, false)
})
