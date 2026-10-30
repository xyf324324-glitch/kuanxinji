import { buildPushPayload } from '@block65/webcrypto-web-push'
import { validateSchedule, nextDue, kindAt } from './schedule.mjs'

const json = (value, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'no-store' } })
const hash = async value => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))).map(n => n.toString(16).padStart(2, '0')).join('')
export async function identity(subscription) {
  const url = new URL(subscription?.endpoint)
  const allowed = ['web.push.apple.com', 'push.apple.com', 'fcm.googleapis.com', 'updates.push.services.mozilla.com', 'notify.windows.com']
  if (url.protocol !== 'https:' || url.port || url.username || url.password || !allowed.some(h => url.hostname === h || url.hostname.endsWith(`.${h}`))) throw new Error('Invalid push endpoint')
  if (!/^[A-Za-z0-9_-]{87}={0,2}$/.test(subscription.keys?.p256dh) || !/^[A-Za-z0-9_-]{22}={0,2}$/.test(subscription.keys?.auth) || url.href.length > 4096) throw new Error('Invalid subscription')
  // Endpoint alone cannot authorize changes: include both secret subscription keys.
  return hash(JSON.stringify([url.href, subscription.keys.p256dh, subscription.keys.auth]))
}
export async function sendPush(env, row, kind, tag) {
  const sub = JSON.parse(row.subscription)
  let payload
  try { payload = await buildPushPayload({ data: JSON.stringify({ kind, tag }), options: { ttl: 300 } }, sub, {
    subject: 'https://kuanxinji.pages.dev', publicKey: env.VAPID_PUBLIC_KEY, privateKey: env.VAPID_PRIVATE_KEY,
  }) } catch (cause) {
    const error = new Error('Push payload failed')
    error.deliveryCode = `payload-${['InvalidAccessError', 'DataError', 'OperationError', 'TypeError', 'NotSupportedError'].includes(cause.name) ? cause.name : 'error'}`
    throw error
  }
  // Workers supports manual/follow only. Never follow redirects with push credentials.
  try { return await fetch(sub.endpoint, { ...payload, redirect: 'manual', signal: AbortSignal.timeout(15000) }) }
  catch (cause) {
    const error = new Error('Push transport failed')
    error.deliveryCode = `transport-${cause.name === 'TimeoutError' ? 'timeout' : 'error'}`
    throw error
  }
}
export async function tick(env, now = Date.now(), sender = sendPush) {
  await env.DB.prepare("INSERT INTO service_state(id, value) VALUES('heartbeat', ?) ON CONFLICT(id) DO UPDATE SET value=excluded.value").bind(now).run()
  const rows = await env.DB.prepare('SELECT * FROM subscriptions WHERE next_due <= ? OR test_due <= ? LIMIT 100').bind(now, now).all()
  for (const row of rows.results) {
    const times = JSON.parse(row.times)
    const isTest = row.test_due !== null && row.test_due <= now
    const due = isTest ? row.test_due : row.next_due
    const deliveryId = `${row.id}:${isTest ? 'test' : 'daily'}:${due}`
    // Unique claim prevents concurrent cron invocations sending the same slot twice.
    const claim = await env.DB.prepare("INSERT OR IGNORE INTO deliveries(id,subscription_id,due,state,updated_at) VALUES(?,?,?,'sending',?)").bind(deliveryId, row.id, due, now).run()
    if (!claim.meta.changes) {
      if (now - due > 120000) {
        if (isTest) await env.DB.prepare('UPDATE subscriptions SET test_due=NULL WHERE id=? AND test_due=?').bind(row.id, due).run()
        else await env.DB.prepare('UPDATE subscriptions SET next_due=? WHERE id=? AND next_due=?').bind(nextDue(times, row.time_zone, now), row.id, due).run()
      }
      continue
    }
    let state = 'expired'
    try {
      // Old reminders are skipped rather than arriving hours late in a burst.
      if (now - due <= 300000) {
        // Recheck after claiming in case the user disabled or changed this schedule.
        const current = await env.DB.prepare('SELECT * FROM subscriptions WHERE id=?').bind(row.id).first()
        if (current && (isTest ? current.test_due === due : current.next_due === due)) {
          const response = await sender(env, current, isTest ? 'both' : kindAt(times, row.time_zone, due), deliveryId)
          state = response.ok ? 'accepted' : `http-${response.status}`
          if (response.status === 404 || response.status === 410) await env.DB.prepare('DELETE FROM subscriptions WHERE id=?').bind(row.id).run()
        } else state = 'cancelled'
      }
    } catch (error) { state = error.deliveryCode || 'failed' }
    await env.DB.prepare('UPDATE deliveries SET state=?, attempts=1, updated_at=? WHERE id=?').bind(state, now, deliveryId).run()
    // Do not blindly retry ambiguous delivery failures: that can duplicate a received alert.
    if (isTest) await env.DB.prepare('UPDATE subscriptions SET test_due=NULL WHERE id=? AND test_due=?').bind(row.id, due).run()
    else await env.DB.prepare('UPDATE subscriptions SET next_due=? WHERE id=? AND next_due=?').bind(nextDue(times, row.time_zone, now), row.id, due).run()
  }
  // Recover claims abandoned by a crashed invocation without duplicating the alert.
  await env.DB.prepare("DELETE FROM deliveries WHERE updated_at < ?").bind(now - 7 * 86400000).run()
}
export default {
  async scheduled(event, env) { await tick(env, event.scheduledTime) },
  async fetch(request, env) {
    const action = new URL(request.url).pathname.split('/').pop()
    try {
      const heartbeat = await env.DB.prepare("SELECT value FROM service_state WHERE id='heartbeat'").first()
      const ready = !!env.VAPID_PUBLIC_KEY && !!env.VAPID_PRIVATE_KEY && !!heartbeat && Date.now() - heartbeat.value < 180000
      if (action === 'config' && request.method === 'GET') return json({ ok: true, enabled: ready, ...(ready ? { publicKey: env.VAPID_PUBLIC_KEY } : {}) })
      if (request.method !== 'POST') return json({ ok: false }, 405)
      if (Number(request.headers.get('content-length')) > 12000) return json({ ok: false }, 413)
      const raw = await request.text()
      if (raw.length > 12000) return json({ ok: false }, 413)
      const body = JSON.parse(raw), id = await identity(body.subscription), now = Date.now()
      const existing = await env.DB.prepare('SELECT * FROM subscriptions WHERE id=?').bind(id).first()
      if (action === 'status') return json({ ok: true, enabled: !!existing, times: existing ? JSON.parse(existing.times) : undefined })
      if (action === 'unsubscribe') {
        await env.DB.prepare('DELETE FROM subscriptions WHERE id=?').bind(id).run()
        return json({ ok: true, enabled: false })
      }
      if (!ready) return json({ ok: false, error: 'service_unavailable' }, 503)
      if (action === 'test') {
        if (!existing) return json({ ok: false }, 404)
        if (existing.last_test > now - 60000) return json({ ok: false, error: 'rate_limit' }, 429)
        const due = Math.floor(now / 60000) * 60000 + 120000
        await env.DB.prepare('UPDATE subscriptions SET test_due=?,last_test=? WHERE id=?').bind(due, now, id).run()
        return json({ ok: true, due })
      }
      if (!['subscribe', 'schedule'].includes(action)) return json({ ok: false }, 404)
      if (action === 'schedule' && !existing) return json({ ok: false }, 404)
      if (existing && existing.updated_at > now - 2000) return json({ ok: false, error: 'rate_limit' }, 429)
      const times = validateSchedule(body.times, body.timeZone)
      await env.DB.prepare(`INSERT INTO subscriptions(id,subscription,times,time_zone,next_due,updated_at) VALUES(?,?,?,?,?,?)
        ON CONFLICT(id) DO UPDATE SET subscription=excluded.subscription,times=excluded.times,time_zone=excluded.time_zone,next_due=excluded.next_due,updated_at=excluded.updated_at`)
        .bind(id, JSON.stringify(body.subscription), JSON.stringify(times), body.timeZone, nextDue(times, body.timeZone, now), now).run()
      return json({ ok: true, enabled: true, times })
    } catch (error) {
      // Never return subscription endpoints/keys or backend error messages.
      return json({ ok: false, error: error instanceof TypeError || error instanceof SyntaxError || error instanceof RangeError || error.message?.startsWith('Invalid') ? 'invalid_request' : 'service_error' }, 400)
    }
  },
}
