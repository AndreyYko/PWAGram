const dbPromise = idb.open('post-store', 1, db => {
  if (!db.objectStoreNames.contains('posts')) {
    db.createObjectStore('posts', { keyPath: 'id' })
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
      const tx = db.transaction(storeName)
      const store = tx.objectStore(storeName)
      return store.getAll()
    })
}