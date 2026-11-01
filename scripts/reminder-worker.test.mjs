import { test } from 'node:test'
import assert from 'node:assert/strict'
import { waitForReminderWorker } from '../src/lib/reminder-worker.js'

test('first installation waits for activation without another user click', async () => {
  let activate
  const registration = { active: {}, pushManager: {} }
  const container = { getRegistration: async () => ({ installing: {} }), ready: new Promise(resolve => { activate = resolve }) }
  let finished = false
  const waiting = waitForReminderWorker(container, 1000).then(value => { finished = true; return value })
  await Promise.resolve()
  assert.equal(finished, false)
  activate(registration)
  assert.equal(await waiting, registration)
})

test('already active worker does not wait for a new installation', async () => {
  const registration = { active: {} }
  assert.equal(await waitForReminderWorker({ getRegistration: async () => registration, ready: new Promise(() => {}) }, 1000), registration)
})

test('failed installation cannot wait forever or claim success', async () => {
  await assert.rejects(waitForReminderWorker({ getRegistration: async () => undefined, ready: new Promise(() => {}) }, 10), /准备超时/)
  await assert.rejects(waitForReminderWorker({ getRegistration: async () => { throw new Error('registration failed') } }, 1000), /registration failed/)
})
