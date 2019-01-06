const CACHE_STATIC_NAME = 'static-v3'
const CACHE_DYNAMIC_NAME = 'dynamic-v3'
const STATIC_FILES = [
  '/',
  '/index.html',
  '/offline.html',
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
]

function trimCache (cacheName, maxItems) {
  caches.open(cacheName)
    .then(cache => {
      return cache.keys()
        .then(keys => {
          if (keys.length > maxItems) {
            cache.delete(keys[0])
              .then(() => trimCache(cacheName, maxItems))
          }
        })
    })
}

self.addEventListener('install', e => {
  console.log('[Service Worker] Installing...', e)
  e.waitUntil(
    caches.open(CACHE_STATIC_NAME)
      .then(cache => {
        console.log('[Service Worker] Precaching App Shell')
        return cache.addAll(STATIC_FILES)
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
  const url = 'https://httpbin.org/get'
  if (e.request.url.indexOf(url) > -1) {
    e.respondWith(
      caches.open(CACHE_DYNAMIC_NAME)
        .then(cache => {
          return fetch(e.request)
            .then(res => {
              // trimCache(CACHE_DYNAMIC_NAME, 3)
              cache.put(e.request, res.clone())
              return res
            })
        })
    )
  } else if (STATIC_FILES.includes(e.request.url)) {
    e.respondWith(caches.match(e.request))
  } else {
    e.respondWith(
      caches.match(e.request)
        .then(response => {
          if (response) return response
          return fetch(e.request)
            .then(res => {
              return caches.open(CACHE_DYNAMIC_NAME)
                .then(cache => {
                  // trimCache(CACHE_DYNAMIC_NAME, 3)
                  cache.put(e.request.url, res.clone())
                  return res
                })
            })
            .catch(err => {
              return caches.open(CACHE_STATIC_NAME)
                .then(cache => {
                  if (e.request.headers.get('accept').includes('text/html')) {
                    return cache.match('/offline.html')
                  }
                })
            })
        })
    )
  }
})

// self.addEventListener('fetch', e => {
//   e.respondWith(
//     caches.match(e.request)
//       .then(response => {
//         if (response) return response
//         return fetch(e.request)
//           .then(res => {
//             return caches.open(CACHE_DYNAMIC_NAME)
//               .then(cache => {
//                 cache.put(e.request.url, res.clone())
//                 return res
//               })
//           })
//           .catch(e => {
//             return caches.open(CACHE_STATIC_NAME)
//               .then(cache => {
//                 return cache.match('/offline.html')
//               })
//           })
//       })
//   )
// })

// Cache-only
// self.addEventListener('fetch', e => {
//   e.respondWith(
//     caches.match(e.request)
//   )
// })

// Network-only
// self.addEventListener('fetch', e => {
 //   e.respondWith(
//     fetch(e.request)
//   )
// })

// Network, then cache
// self.addEventListener('fetch', e => {
//   e.respondWith(
//     fetch(e.request)
//       .then(res => {
//         return caches.open(CACHE_DYNAMIC_NAME)
//           .then(cache => {
//             cache.put(e.request.url, res.clone())
//             return res
//           })
//       })
//       .catch(e => {
//         return caches.match(e.request)
//       })
//   )
// })