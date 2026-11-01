// Initial installation can still be running when notification permission is granted.
// Keep permission requests in the click handler; only wait for activation afterwards.
export function waitForReminderWorker(container, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('提醒功能准备超时，请检查网络后再次开启。')), timeoutMs)
    Promise.resolve().then(async () => {
      const current = await container.getRegistration()
      return current?.active ? current : container.ready
    }).then((registration) => {
      if (!registration?.active) throw new Error('提醒功能未能完成准备，请检查网络后重新打开。')
      resolve(registration)
    }).catch(reject).finally(() => clearTimeout(timer))
  })
}
