self.addEventListener('install', e => {
  console.log('[Service Worker] Installing...', e)
})

self.addEventListener('activate', e => {
  console.log('[Service Worker] Activating...', e)
  return self.clients.claim()
})

self.addEventListener('fetch', e => {
  console.log('[Service Worker] Fetching...', e)
  e.respondWith(fetch(e.request))
})