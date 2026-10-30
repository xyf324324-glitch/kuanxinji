import { test, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { androidRequest } from '../src/lib/android-reminders.js'
import { loadReminderConfig, getReminderStatus, enableReminders, updateReminderTimes, testReminder, disableReminders } from '../src/lib/reminders.js'
afterEach(() => { delete globalThis.window })
function bridge(handle) {
  const native = { postMessage(raw) {
    const request = JSON.parse(raw)
    queueMicrotask(() => native.onmessage({ data: JSON.stringify({ id: request.id, ...handle(request) }) }))
  } }
  globalThis.window = { KuanxinAndroid: native }
}
test('native reminders work without browser Web Push and preserve custom times', async () => {
  let enabled = false, times
  const calls = []
  bridge(request => {
    calls.push(request.action)
    if (request.action === 'enable' || request.action === 'schedule') { times = request.times; enabled = true }
    if (request.action === 'disable') enabled = false
    return { ok: true, data: { enabled, times, due: Date.now()+60000 } }
  })
  assert.deepEqual(await loadReminderConfig(), { enabled: true, native: true })
  assert.equal(await getReminderStatus(), null)
  const custom = { nianfo: ['08:30','21:00'], huiguang: ['09:00','13:00','21:00'] }
  const result = await enableReminders({ native: true }, custom)
  assert.equal(result.subscription.native, true)
  assert.deepEqual(result.times, custom)
  const next = { ...custom, nianfo: ['08:00'] }
  assert.deepEqual(await updateReminderTimes(result.subscription, next), next)
  await testReminder(result.subscription)
  await disableReminders(result.subscription)
  assert.equal(await getReminderStatus(), null)
  assert.deepEqual(calls, ['status','enable','schedule','test','disable','status'])
})
test('permission denial cannot report enabled success', async () => {
  bridge(() => ({ ok: false, error: '尚未允许通知' }))
  await assert.rejects(enableReminders({ native: true }, null), /尚未允许通知/)
})
test('unknown native replies cannot resolve another pending request', async () => {
  bridge(() => ({ ok: true, data: { enabled: true } }))
  assert.equal((await androidRequest('status')).enabled, true)
})
