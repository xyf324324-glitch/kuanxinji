import { useEffect, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'

export function usePwaStatus() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)
  const [offlineReady, setOfflineReady] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [updateServiceWorker, setUpdateServiceWorker] = useState(null)

  useEffect(() => {
    const markOnline = () => setIsOnline(true)
    const markOffline = () => setIsOnline(false)
    window.addEventListener('online', markOnline)
    window.addEventListener('offline', markOffline)

    const updateSW = registerSW({
      immediate: true,
      onOfflineReady: () => setOfflineReady(true),
      onNeedRefresh: () => setUpdateAvailable(true),
    })
    setUpdateServiceWorker(() => updateSW)

    return () => {
      window.removeEventListener('online', markOnline)
      window.removeEventListener('offline', markOffline)
    }
  }, [])

  return {
    isOnline,
    offlineReady,
    updateAvailable,
    dismissOfflineReady: () => setOfflineReady(false),
    dismissUpdate: () => setUpdateAvailable(false),
    applyUpdate: () => updateServiceWorker?.(true),
  }
}
