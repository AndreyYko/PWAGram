importScripts('/src/js/idb.js')
importScripts('/src/js/utility.js')

const CACHE_STATIC_NAME = 'static-v21'
const CACHE_DYNAMIC_NAME = 'dynamic-v2'
const STATIC_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/src/js/app.js',
  '/src/js/feed.js',
  '/src/js/idb.js',
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
  const url = 'https://pwagram-da146.firebaseio.com/posts'
  if (e.request.url.indexOf(url) > -1) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const cloneRes = res.clone()
          clearAllData('posts')
            .then(() => {
              return cloneRes.json()
            })
            .then(data => {
              for (const key in data) {
                writeData('posts', data[key])
              }
            })
          return res
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

self.addEventListener('sync', e => {
  console.log('[Service Worker] Background syncing', e)
  if (e.tag === 'sync-new-posts') {
    console.log('[Service Worker] Syncing new Posts')
    e.waitUntil(
      readAllData('sync-posts')
        .then(data => {
          for (let post of data) {
            fetch('https://pwagram-da146.firebaseio.com/posts.json', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify({
                id: post.id,
                title: post.title,
                location: post.location,
                image: 'https://firebasestorage.googleapis.com/v0/b/pwagram-da146.appspot.com/o/san-francisco.jpg?alt=media&token=3ab72862-e880-4abf-93ea-3937581f14d7'
              })
            })
              .then(res => {
                console.log('Send data', res)
                deleteItemFromData('sync-posts', post.id)
              })
              .catch(error => {
                console.log('Error while sending data', error)
              })
          }

        })
    )
  }
})