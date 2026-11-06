// This object is injected by AndroidX WebKit only into the allowed HTTPS origin.
const pending = new Map()
let boundBridge
export function hasAndroidReminders() { return typeof window !== 'undefined' && typeof window.KuanxinAndroid?.postMessage === 'function' }
export function androidRequest(action, data = {}) {
  if (!hasAndroidReminders()) return Promise.reject(new Error('安卓提醒服务未连接'))
  const bridge = window.KuanxinAndroid
  if (boundBridge !== bridge) {
    bridge.onmessage = event => {
      let response
      try { response = JSON.parse(event.data) } catch { return }
      const item = pending.get(response.id)
      if (!item) return
      clearTimeout(item.timer); pending.delete(response.id)
      if (response.ok) item.resolve(response.data)
      else item.reject(new Error(response.error || '操作未完成，请重试'))
    }
    boundBridge = bridge
  }
  return new Promise((resolve, reject) => {
    const id = crypto.randomUUID()
    const timer = setTimeout(() => { pending.delete(id); reject(new Error('等待系统设置超时，请返回后重试')) }, 120000)
    pending.set(id, { resolve, reject, timer })
    try { bridge.postMessage(JSON.stringify({ id, action, ...data })) }
    catch { clearTimeout(timer); pending.delete(id); reject(new Error('无法连接安卓提醒服务')) }
  })
}
