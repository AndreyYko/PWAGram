const CACHE_STATIC_NAME = 'static-v8'
const CACHE_DYNAMIC_NAME = 'dynamic-v2'

self.addEventListener('install', e => {
  console.log('[Service Worker] Installing...', e)
  e.waitUntil(
    caches.open(CACHE_STATIC_NAME)
      .then(cache => {
        console.log('[Service Worker] Precaching App Shell')
        cache.addAll([
          '/',
          '/index.html',
          '/src/js/app.js',
          '/src/js/feed.js',
          '/src/js/fetch.js',
          '/src/js/promise.js',
          '/src/js/material.min.js',
          '/src/css/app.css',
          '/src/css/feed.css',
          '/src/images/main-image.jpg',
          'https://fonts.googleapis.com/css?family=Roboto:400,700',
          'https://fonts.googleapis.com/icon?family=Material+Icons',
          'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
        ])
      })
  )
})

self.addEventListener('activate', e => {
  console.log('[Service Worker] Activating...', e)
  e.waitUntil(
    caches.keys()
      .then(keyList => {
        return Promise.all(keyList.map(key => {
          if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
            console.log('[Service Worker] deleting old cache.', key)
            return caches.delete(key)
          }
        }))
      })
  )
  return self.clients.claim()
})

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request)
      .then(response => {
        if (response) return response
        return fetch(e.request)
          .then(res => {
            return caches.open(CACHE_DYNAMIC_NAME)
              .then(cache => {
                cache.put(e.request.url, res.clone())
                return res
              })
          })
          .catch(e => {})
      })
  )
})