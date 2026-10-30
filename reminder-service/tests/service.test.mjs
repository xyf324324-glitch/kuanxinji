import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import { readFileSync } from 'node:fs'
import { defaults, validateSchedule, nextDue, kindAt } from '../schedule.mjs'
import worker, { tick, identity } from '../worker.mjs'
import { buildPushPayload } from '@block65/webcrypto-web-push'

function db() {
  const sql = new DatabaseSync(':memory:')
  sql.exec(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'))
  return { prepare(query) {
    let args = []
    return { bind(...values) { args = values; return this }, async first() { return sql.prepare(query).get(...args) || null }, async all() { return { results: sql.prepare(query).all(...args) } }, async run() { return { meta: { changes: sql.prepare(query).run(...args).changes } } } }
  } }
}
const sub = { endpoint: 'https://web.push.apple.com/test-device', keys: { p256dh: 'A'.repeat(87), auth: 'B'.repeat(22) } }
const request = (action, body) => new Request(`https://internal/api/reminders/${action}`, body ? { method: 'POST', body: JSON.stringify(body) } : {})
test('local schedule, combined alerts, midday only, DST and invalid input', () => {
  assert.equal(nextDue(defaults, 'Asia/Shanghai', Date.parse('2026-10-30T00:59:00Z')), Date.parse('2026-10-30T01:00:00Z'))
  assert.equal(kindAt(defaults, 'Asia/Shanghai', Date.parse('2026-10-30T01:00Z')), 'both')
  assert.equal(kindAt(defaults, 'Asia/Shanghai', Date.parse('2026-10-30T05:00Z')), 'huiguang')
  const dst = { nianfo: ['02:30'], huiguang: ['02:30'] }
  assert.equal(nextDue(dst, 'America/New_York', Date.parse('2026-03-08T06:59Z')), Date.parse('2026-03-09T06:30Z'))
  assert.throws(() => validateSchedule({ ...defaults, nianfo: ['25:00'] }, 'Asia/Shanghai'))
  assert.throws(() => validateSchedule(defaults, 'fake/timezone'))
})
test('refuses private endpoints; subscription keys are part of device authorization', async () => {
  await assert.rejects(identity({ ...sub, endpoint: 'https://127.0.0.1/private' }))
  await assert.rejects(identity({ ...sub, endpoint: 'https://web.push.apple.com.evil.test/' }))
  assert.notEqual(await identity(sub), await identity({ ...sub, keys: { ...sub.keys, auth: 'C'.repeat(22) } }))
})
test('service stays disabled without live cron; subscribe/status/update/disable use persistent state', async () => {
  const env = { DB: db(), VAPID_PUBLIC_KEY: 'public', VAPID_PRIVATE_KEY: 'private' }
  assert.equal((await (await worker.fetch(request('config'), env)).json()).enabled, false)
  await tick(env)
  const body = { subscription: sub, times: defaults, timeZone: 'Asia/Shanghai' }
  assert.equal((await (await worker.fetch(request('subscribe', body), env)).json()).enabled, true)
  assert.equal((await (await worker.fetch(request('status', body), env)).json()).enabled, true)
  const tampered = { subscription: { ...sub, keys: { ...sub.keys, auth: 'C'.repeat(22) } } }
  assert.equal((await (await worker.fetch(request('status', tampered), env)).json()).enabled, false)
  await worker.fetch(request('unsubscribe', body), env)
  assert.equal((await (await worker.fetch(request('status', body), env)).json()).enabled, false)
})
test('cron merges same-time practices, prevents duplicate delivery, retires expired subscriptions', async () => {
  const env = { DB: db() }, due = Date.parse('2026-10-30T01:00Z')
  await env.DB.prepare('INSERT INTO subscriptions(id,subscription,times,time_zone,next_due,updated_at) VALUES(?,?,?,?,?,?)').bind('one', JSON.stringify(sub), JSON.stringify(defaults), 'Asia/Shanghai', due, due - 60000).run()
  const calls = []
  const sender = async (_env, _row, kind) => { calls.push(kind); return new Response('', { status: 201 }) }
  await tick(env, due, sender)
  await tick(env, due, sender)
  assert.deepEqual(calls, ['both'])
  assert.equal((await env.DB.prepare('SELECT next_due FROM subscriptions').first()).next_due, Date.parse('2026-10-30T05:00Z'))
  await tick(env, Date.parse('2026-10-30T05:00Z'), async () => new Response('', { status: 410 }))
  assert.equal(await env.DB.prepare('SELECT * FROM subscriptions').first(), null)
})
test('abandoned claim cannot freeze future reminders, and late slots do not flood users', async () => {
  const env = { DB: db() }, due = Date.parse('2026-10-30T01:00Z')
  await env.DB.prepare('INSERT INTO subscriptions(id,subscription,times,time_zone,next_due,updated_at) VALUES(?,?,?,?,?,?)').bind('one', JSON.stringify(sub), JSON.stringify(defaults), 'Asia/Shanghai', due, due).run()
  await env.DB.prepare('INSERT INTO deliveries(id,subscription_id,due,state,updated_at) VALUES(?,?,?,?,?)').bind(`one:daily:${due}`, 'one', due, 'sending', due).run()
  let calls = 0
  await tick(env, due + 600000, async () => { calls++; return new Response() })
  assert.equal(calls, 0)
  assert.ok((await env.DB.prepare('SELECT next_due FROM subscriptions').first()).next_due > due + 600000)
})
test('Web Push uses Apple-compatible aes128gcm and valid VAPID authorization', async () => {
  const vapid = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])
  const jwk = await crypto.subtle.exportKey('jwk', vapid.privateKey)
  const client = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'])
  const subscription = { ...sub, keys: { auth: Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64url'), p256dh: Buffer.from(await crypto.subtle.exportKey('raw', client.publicKey)).toString('base64url') } }
  const payload = await buildPushPayload({ data: { kind: 'both' }, options: { ttl: 300 } }, subscription, { publicKey: Buffer.from(await crypto.subtle.exportKey('raw', vapid.publicKey)).toString('base64url'), privateKey: jwk.d, subject: 'https://kuanxinji.pages.dev' })
  assert.equal(payload.headers['content-encoding'], 'aes128gcm')
  assert.match(payload.headers.authorization, /^vapid /i)
  assert.equal(payload.body.byteLength, 4096)
})
