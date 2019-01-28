const dbPromise = idb.open('post-store', 1, db => {
  if (!db.objectStoreNames.contains('posts')) {
    db.createObjectStore('posts', { keyPath: 'id' })
  }
  if (!db.objectStoreNames.contains('sync-posts')) {
    db.createObjectStore('sync-posts', { keyPath: 'id' })
  }
})

function writeData (storeName, data) {
  return dbPromise
    .then(db => {
      const tx = db.transaction(storeName, 'readwrite')
      const store = tx.objectStore(storeName)
      store.put(data)
      return tx.complete
    })
}

function readAllData (storeName) {
  return dbPromise
    .then(db => {
      const tx = db.transaction(storeName, 'readonly')
      const store = tx.objectStore(storeName)
      return store.getAll()
    })
}

function clearAllData (storeName) {
  return dbPromise
    .then(db => {
      const tx = db.transaction(storeName, 'readwrite')
      const store = tx.objectStore(storeName)
      store.clear()
      return tx.complete
    })
}

function deleteItemFromData (storeName, id) {
  return dbPromise
    .then(db => {
      const tx = db.transaction(storeName, 'readwrite')
      const store = tx.objectStore(storeName)
      store.delete(id)
      return tx.complete
    })
}

function urlBase64ToUnit8Array (base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

function dataURItoBlob (dataURI) {
  const byteString = window.atob(dataURI.split(',')[1])
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
  const ab = new ArrayBuffer(byteString.length)
  const ia = new Uint8Array(ab)
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i)
  }
  const blob = new Blob([ab], { type: mimeString })
  return blob
}