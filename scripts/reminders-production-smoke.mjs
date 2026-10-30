// Creates and removes one synthetic device. Never targets a real person's subscription.
import assert from 'node:assert/strict'
const origin = 'https://kuanxinji.pages.dev'
const key = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'])
const subscription = {
  endpoint: `https://web.push.apple.com/kuanxinji-smoke-${crypto.randomUUID()}`,
  keys: {
    p256dh: Buffer.from(await crypto.subtle.exportKey('raw', key.publicKey)).toString('base64url'),
    auth: Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64url'),
  },
}
async function request(action, body) {
  const response = await fetch(`${origin}/api/reminders/${action}`, {
    ...(body ? { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ subscription, ...body }) } : {}),
    signal: AbortSignal.timeout(15000),
  })
  assert.equal(response.status, 200, `${action} HTTP status`)
  return response.json()
}
const config = await request('config')
if (!config.enabled) { console.log('Cron not ready yet; no synthetic device created.'); process.exit(2) }
assert.match(config.publicKey, /^[A-Za-z0-9_-]{87}$/)
try {
  const times = { nianfo: ['09:00', '21:00'], huiguang: ['09:00', '13:00', '21:00'] }
  assert.equal((await request('subscribe', { times, timeZone: 'Asia/Shanghai' })).enabled, true)
  assert.equal((await request('status', {})).enabled, true)
  await new Promise(resolve => setTimeout(resolve, 2100))
  const next = { ...times, huiguang: ['09:00', '13:01', '21:00'] }
  assert.deepEqual((await request('schedule', { times: next, timeZone: 'Asia/Shanghai' })).times, next)
  const test = await request('test', {})
  assert.ok(test.due > Date.now())
} finally {
  assert.equal((await request('unsubscribe', {})).enabled, false)
}
assert.equal((await request('status', {})).enabled, false)
console.log('PASS: live cron readiness, persisted subscribe/status/update/test scheduling/unsubscribe. Synthetic device removed; real iPhone receipt still requires device testing.')
