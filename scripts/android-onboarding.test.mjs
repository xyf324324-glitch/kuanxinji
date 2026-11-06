import { test, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { backgroundGuide, needsAndroidDownload } from '../src/lib/android-onboarding.js'
import { testReminder } from '../src/lib/reminders.js'
const originalFetch = globalThis.fetch
afterEach(() => { globalThis.fetch = originalFetch })
test('WeChat and browser Android use download flow while native app and iPhone keep permission flow', () => {
  assert.equal(needsAndroidDownload('Android MicroMessenger', false), true)
  assert.equal(needsAndroidDownload('Android Chrome', false), true)
  assert.equal(needsAndroidDownload('Android', true), false)
  assert.equal(needsAndroidDownload('iPhone', false), false)
})
test('manufacturer guidance includes the settings proven on the tested devices', () => {
  assert.match(backgroundGuide('Xiaomi').text, /自启动/)
  assert.match(backgroundGuide('samsung').text, /深度休眠/)
  assert.match(backgroundGuide('HUAWEI').text, /关联启动/)
})
test('test failures distinguish rate limit, expired subscription and service health', async () => {
  const subscription = { toJSON: () => ({ endpoint: 'https://example.test' }) }
  for (const [status, pattern] of [[429, /前一次可能已安排/], [404, /订阅已失效/], [503, /服务暂时不可用/], [403, /未被接受/]]) {
    globalThis.fetch = async () => Response.json({ ok: false }, { status })
    await assert.rejects(testReminder(subscription), pattern)
  }
  globalThis.fetch = async () => { throw new TypeError('network failure') }
  await assert.rejects(testReminder(subscription), /可能已安排/)
})
