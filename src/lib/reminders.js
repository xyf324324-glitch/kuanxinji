const SETTINGS_KEY = 'kuanxin-reminder-times-v1'
export const DEFAULT_REMINDER_TIMES = { nianfo: ['09:00', '21:00'], huiguang: ['09:00', '13:00', '21:00'] }
const unavailable = '手机提醒服务暂未开放，请稍后再试。'

export function normalizeTimes(value) {
  return Object.fromEntries(Object.entries(DEFAULT_REMINDER_TIMES).map(([key, fallback]) => {
    const times = Array.isArray(value?.[key]) ? value[key].filter((time) => typeof time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(time)) : []
    return [key, times.length ? [...new Set(times)].sort().slice(0, 5) : [...fallback]]
  }))
}

export function loadReminderTimes() {
  try { return normalizeTimes(JSON.parse(localStorage.getItem(SETTINGS_KEY))) }
  catch { return normalizeTimes(null) }
}

export function saveReminderTimes(times) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(normalizeTimes(times)))
}

async function request(path, body) {
  const response = await fetch(`/api/reminders/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: 'no-store',
    signal: AbortSignal.timeout(10000),
  })
  if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw new Error(unavailable)
  const data = await response.json()
  if (data.ok !== true) throw new Error(unavailable)
  return data
}

export async function loadReminderConfig() {
  try {
    const data = await request('config')
    return data.enabled === true && typeof data.publicKey === 'string' && /^[A-Za-z0-9_-]{87}={0,2}$/.test(data.publicKey) ? data : null
  } catch { return null }
}

async function currentSubscription() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window) || Notification.permission !== 'granted') return null
  const registration = await navigator.serviceWorker.getRegistration()
  return registration?.active ? registration.pushManager.getSubscription() : null
}

export async function getReminderStatus() {
  const subscription = await currentSubscription()
  if (!subscription) return null
  const data = await request('status', { subscription: subscription.toJSON() })
  return data.enabled === true ? { subscription, times: normalizeTimes(data.times) } : null
}

export async function enableReminders(config, times) {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  if (isIOS && !window.matchMedia('(display-mode: standalone)').matches && !navigator.standalone) {
    throw new Error('请先将宽心纪添加到主屏幕，再从桌面打开并开启提醒。')
  }
  if (!window.isSecureContext || !('Notification' in window) || !('PushManager' in window) || !('serviceWorker' in navigator)) {
    throw new Error('当前浏览器暂不支持手机提醒，请使用支持通知的浏览器打开。')
  }
  if (!config) throw new Error(unavailable)
  // Request from the user's click, before any asynchronous network work.
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error(permission === 'denied' ? '通知权限已关闭，请在浏览器设置中允许通知后重试。' : '您尚未允许通知，可以稍后再开启。')
  const registration = await navigator.serviceWorker.getRegistration()
  if (!registration?.active) throw new Error('页面正在准备提醒功能，请稍后再试。')
  const publicKey = Uint8Array.from(atob(config.publicKey.replace(/-/g, '+').replace(/_/g, '/')), (character) => character.charCodeAt(0))
  const existing = await registration.pushManager.getSubscription()
  const subscription = existing || await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: publicKey })
  try {
    const data = await request('subscribe', {
      subscription: subscription.toJSON(), times: normalizeTimes(times),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    })
    if (data.enabled !== true) throw new Error(unavailable)
    return { subscription, times: normalizeTimes(data.times || times) }
  } catch (error) {
    if (!existing) await subscription.unsubscribe().catch(() => {})
    throw error
  }
}

export async function updateReminderTimes(subscription, times) {
  const data = await request('schedule', {
    subscription: subscription.toJSON(), times: normalizeTimes(times),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  })
  if (data.enabled !== true) throw new Error(unavailable)
  return normalizeTimes(data.times || times)
}

export async function disableReminders(subscription) {
  // Remove the server schedule first; a failed request must not claim success.
  const data = await request('unsubscribe', { subscription: subscription.toJSON() })
  if (data.enabled !== false) throw new Error(unavailable)
  await subscription.unsubscribe().catch(() => {})
}
