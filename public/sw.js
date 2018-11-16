self.addEventListener('install', e => {
  console.log('[Service Worker] Installing...', e)
})

self.addEventListener('activate', e => {
  console.log('[Service Worker] Activating...', e)
  return self.clients.claim()
})