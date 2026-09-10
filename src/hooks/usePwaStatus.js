import { useEffect, useRef, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'
import contentVersion from '../content/content-version.json'

async function getApprovedRelease() {
  try {
    const response = await fetch(`/release-control.json?time=${Date.now()}`, { cache: 'no-store' })
    if (!response.ok) return null
    const release = await response.json()
    if (release.approved !== true || !release.release) return null
    return release
  } catch {
    return null
  }
}

export function usePwaStatus() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)
  const [offlineReady, setOfflineReady] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [updateServiceWorker, setUpdateServiceWorker] = useState(null)
  const [targetVersion, setTargetVersion] = useState('')
  const [isApplyingUpdate, setIsApplyingUpdate] = useState(false)
  const registrationRef = useRef(null)
  const dismissedVersionRef = useRef('')
  const reloadOnControllerChangeRef = useRef(false)

  useEffect(() => {
    let isActive = true
    const markOnline = () => setIsOnline(true)
    const markOffline = () => setIsOnline(false)
    window.addEventListener('online', markOnline)
    window.addEventListener('offline', markOffline)

    const showApprovedRelease = async ({ refreshWorker = false } = {}) => {
      if (!navigator.onLine) return
      const release = await getApprovedRelease()
      if (!isActive || !release) return

      if (refreshWorker) {
        try {
          await registrationRef.current?.update()
        } catch {
          // The version prompt remains useful even when the update check is temporarily unavailable.
        }
      }

      if (
        release.release !== contentVersion.version
        && release.release !== dismissedVersionRef.current
      ) {
        setTargetVersion(release.release)
        setUpdateAvailable(true)
      }
    }

    const updateSW = registerSW({
      immediate: true,
      onOfflineReady: () => setOfflineReady(true),
      onRegisteredSW: (_serviceWorkerUrl, registration) => {
        registrationRef.current = registration
        void showApprovedRelease({ refreshWorker: true })
      },
      onNeedRefresh: async () => {
        const release = await getApprovedRelease()
        if (!isActive || !release || release.release === dismissedVersionRef.current) return
        setTargetVersion(release.release)
        setUpdateAvailable(true)
      },
    })
    setUpdateServiceWorker(() => updateSW)

    const checkWhenVisible = () => {
      if (document.visibilityState === 'visible') void showApprovedRelease({ refreshWorker: true })
    }
    const reloadAfterActivation = () => {
      if (reloadOnControllerChangeRef.current) window.location.reload()
    }

    void showApprovedRelease()
    window.addEventListener('focus', checkWhenVisible)
    document.addEventListener('visibilitychange', checkWhenVisible)
    navigator.serviceWorker?.addEventListener('controllerchange', reloadAfterActivation)

    return () => {
      isActive = false
      window.removeEventListener('online', markOnline)
      window.removeEventListener('offline', markOffline)
      window.removeEventListener('focus', checkWhenVisible)
      document.removeEventListener('visibilitychange', checkWhenVisible)
      navigator.serviceWorker?.removeEventListener('controllerchange', reloadAfterActivation)
    }
  }, [])

  const dismissUpdate = () => {
    dismissedVersionRef.current = targetVersion
    setUpdateAvailable(false)
  }

  const applyUpdate = async () => {
    setIsApplyingUpdate(true)
    reloadOnControllerChangeRef.current = true
    try {
      await registrationRef.current?.update()
      await updateServiceWorker?.(true)
      window.setTimeout(() => window.location.reload(), 2500)
    } catch {
      window.location.reload()
    }
  }

  return {
    isOnline,
    offlineReady,
    updateAvailable,
    targetVersion,
    isApplyingUpdate,
    dismissOfflineReady: () => setOfflineReady(false),
    dismissUpdate,
    applyUpdate,
  }
}
