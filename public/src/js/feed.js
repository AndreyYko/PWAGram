var shareImageButton = document.querySelector('#share-image-button')
var createPostArea = document.querySelector('#create-post')
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn')
var sharedMomentsArea = document.querySelector('#shared-moments')
const form = document.querySelector('form')
const inputTitle = document.querySelector('#title')
const inputLocation = document.querySelector('#location')

function openCreatePostModal() {
  createPostArea.style.display = 'block'
  if (deferredPrompt) {
    deferredPrompt.prompt()

    deferredPrompt.userChoice.then(function(choiceResult) {
      console.log(choiceResult.outcome)

      if (choiceResult.outcome === 'dismissed') {
        console.log('User cancelled installation')
      } else {
        console.log('User added to home screen')
      }
    })

    deferredPrompt = null
  }
}

function closeCreatePostModal() {
  createPostArea.style.display = 'none'
}

// Currently not in use, allows to save assets in cache on demand otherwise
function onClickSaveButtonHandler(e) {
  console.log('clicked')
  if ('caches' in window) {
    caches.open('user-requested')
      .then(cache => {
        cache.add('https://httpbin.org/get')
        cache.add('/src/images/sf-boat.jpg')
      })
  }
}

shareImageButton.addEventListener('click', openCreatePostModal)

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal)

function clearCards () {
  while(sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild)
  }
}

function createCard (item) {
  const { image, title, location } = item
  const cardWrapper = document.createElement('div')
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp'
  const cardTitle = document.createElement('div')
  cardTitle.className = 'mdl-card__title'
  cardTitle.style.backgroundImage = `url(${image})`
  cardTitle.style.backgroundSize = 'cover'
  cardTitle.style.height = '180px'
  cardWrapper.appendChild(cardTitle)
  const cardTitleTextElement = document.createElement('h2')
  cardTitleTextElement.style.color = 'black'
  cardTitleTextElement.className = 'mdl-card__title-text'
  cardTitleTextElement.textContent = title
  cardTitle.appendChild(cardTitleTextElement)
  const cardSupportingText = document.createElement('div')
  cardSupportingText.className = 'mdl-card__supporting-text'
  cardSupportingText.textContent = location
  cardSupportingText.style.textAlign = 'center'
  // const cardSaveButton = document.createElement('button')
  // cardSaveButton.textContent = 'Save'
  // cardSaveButton.addEventListener('click', onClickSaveButtonHandler)
  // cardSupportingText.appendChild(cardSaveButton)
  cardWrapper.appendChild(cardSupportingText)
  componentHandler.upgradeElement(cardWrapper)
  sharedMomentsArea.appendChild(cardWrapper)
}

function updateUI (data) {
  clearCards()
  data.forEach(item => {
    createCard(item)
  })
}

const url = 'https://pwagram-da146.firebaseio.com/posts.json'
let networkDataReceived = false

fetch(url)
  .then(function(res) {
    return res.json()
  })
  .then(function(data) {
    networkDataReceived = true
    console.log('From web', data)
    const dataArray = []
    for (const key in data) {
      dataArray.push(data[key])
    }
    updateUI(dataArray)
  })
  .catch(err => {
    console.log('fetching error')
    console.dir(err)
  })


if ('indexedDB' in window) {
  readAllData('posts')
    .then(data => {
      if (!networkDataReceived) {
        console.log('From indexedDB', data)
        updateUI(data)
      }
    })
}

function sendData () {
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      id: new Date().toISOString(),
      title: inputTitle.value,
      location: inputLocation.value,
      image: 'https://firebasestorage.googleapis.com/v0/b/pwagram-da146.appspot.com/o/san-francisco.jpg?alt=media&token=3ab72862-e880-4abf-93ea-3937581f14d7'
    })
  })
    .then(res => {
      console.log('Send data', res)
    })
}

form.addEventListener('submit', (e) => {
  e.preventDefault()
  if (!inputTitle.value || !inputLocation.value) {
    return false
  }
  closeCreatePostModal()

  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready
      .then(sw => {
        const post = {
          id: new Date().toISOString(),
          title: inputTitle.value,
          location: inputLocation.value
        }
        writeData('sync-posts', post)
          .then(() => {
            return sw.sync.register('sync-new-posts')
          })
          .then(() => {
            const snackbarContainer = document.querySelector('#confirmation-toast')
            const data = { message: 'Your post saved to syncing' }
            snackbarContainer.MaterialSnackbar.showSnackbar(data)
          })
          .catch(error => {
            console.log(error)
          })
      })
  } else {
    sendData()
  }
})