const DATABASE_NAME = 'kuanxin-local-library'
const DATABASE_VERSION = 1

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB is unavailable'))
      return
    }

    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains('saved')) database.createObjectStore('saved', { keyPath: 'id' })
      if (!database.objectStoreNames.contains('progress')) database.createObjectStore('progress', { keyPath: 'id' })
    }
  })
}

async function transact(storeName, mode, action) {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, mode)
    const store = transaction.objectStore(storeName)
    const request = action(store)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => database.close()
  })
}

function fallbackRead(key, fallback) {
  try {
    return JSON.parse(window.localStorage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}

export async function listSavedArticles() {
  try {
    return await transact('saved', 'readonly', (store) => store.getAll())
  } catch {
    return fallbackRead('kuanxin-saved', [])
  }
}

export async function saveArticle(article) {
  const entry = { id: article.id, savedAt: new Date().toISOString() }
  try {
    await transact('saved', 'readwrite', (store) => store.put(entry))
  } catch {
    const saved = fallbackRead('kuanxin-saved', []).filter((item) => item.id !== article.id)
    window.localStorage.setItem('kuanxin-saved', JSON.stringify([...saved, entry]))
  }
}

export async function removeSavedArticle(articleId) {
  try {
    await transact('saved', 'readwrite', (store) => store.delete(articleId))
  } catch {
    const saved = fallbackRead('kuanxin-saved', []).filter((item) => item.id !== articleId)
    window.localStorage.setItem('kuanxin-saved', JSON.stringify(saved))
  }
}

export async function loadReadingProgress() {
  try {
    const entries = await transact('progress', 'readonly', (store) => store.getAll())
    return Object.fromEntries(entries.map((entry) => [entry.id, entry.progress]))
  } catch {
    return fallbackRead('kuanxin-progress', {})
  }
}

export async function saveReadingProgress(articleId, progress) {
  const normalized = Math.max(0, Math.min(100, Math.round(progress)))
  try {
    await transact('progress', 'readwrite', (store) => store.put({ id: articleId, progress: normalized }))
  } catch {
    const current = fallbackRead('kuanxin-progress', {})
    window.localStorage.setItem('kuanxin-progress', JSON.stringify({ ...current, [articleId]: normalized }))
  }
}
