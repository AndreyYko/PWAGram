const shareImageButton = document.querySelector('#share-image-button')
const createPostArea = document.querySelector('#create-post')
const closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn')
const sharedMomentsArea = document.querySelector('#shared-moments')
const form = document.querySelector('form')
const inputTitle = document.querySelector('#title')
const inputLocation = document.querySelector('#location')
const videoPlayer = document.querySelector('#player')
const canvasElement = document.querySelector('#canvas')
const captureButton = document.querySelector('#capture-btn')
const imagePicker = document.querySelector('#image-picker')
const imagePickerArea = document.querySelector('#pick-image')
const locationBtn = document.querySelector('#location-btn')
const locationLoader = document.querySelector('#location-loader')
let picture
let fetchLocation

locationBtn.addEventListener('click', e => {

  locationBtn.style.display = 'none'
  locationLoader.style.display = 'block'

  navigator.geolocation.getCurrentPosition(position => {
    locationBtn.style.display = 'inline'
    locationLoader.style.display = 'none'
    fetchLocation = position.coords.latitude
    // In position we received a js object with coordinates
    // So we can use some libraries (Google maps majority)
    // To parse and get pretty stringify data
    inputLocation.value = fetchLocation
    document.querySelector('#manual-location').classList.add('is-focused')
  }, error => {
    console.log(error)
    locationBtn.style.display = 'inline'
    locationLoader.style.display = 'none'
    window.alert('Could not fetch location, please enter manually!')
    fetchLocation = null
  }, { timeout: 7000 })
})

function initializeLocation () {
  if (!('geolocation' in navigator)) {
    locationBtn.style.display = 'none'
  }
}

function initializeMedia () {
  if (!('mediaDevices' in navigator)) {
    navigator.mediaDevices = {}
  }
  // fallback for browsers which dont support getUserMedia
  if (!('getUserMedia' in navigator.mediaDevices)) {
    navigator.mediaDevices.getUserMedia = function (constraints) {
      const getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia
      if (!getUserMedia) {
        return Promise.reject(new Error('getUserMedia is not implemented'))
      }
      return new Promise((resolve, reject) => {
        getUserMedia.call(navigator, constraints, resolve, reject)
      })
    }
  }
  navigator.mediaDevices.getUserMedia({
    video: {
      width: { min: canvasElement.width, max: canvasElement.width },
      height: { min: canvasElement.height, max: canvasElement.height }
    }
  })
    .then(stream => {
      videoPlayer.srcObject = stream
      videoPlayer.style.display = 'block'
    })
    .catch(error => {
      // when browser not supporting or user not allows access show image picker
      // imagePickerArea.style.display = 'block'
      captureButton.style.display =  'none'
    })
}

captureButton.addEventListener('click', e => {
  canvasElement.style.display = 'block'
  videoPlayer.style.display = 'none'
  captureButton.style.display = 'none'
  const context = canvasElement.getContext('2d')
  const width = videoPlayer.videoWidth
  const height = videoPlayer.videoHeight
  canvasElement.style.width = width + 'px'
  canvasElement.style.height = height + 'px'
  context.drawImage(videoPlayer, 0, 0, height, width)
  videoPlayer.srcObject.getVideoTracks().forEach(track => {
    track.stop()
  })
  picture = dataURItoBlob(canvasElement.toDataURL())
})

// Fallback for devices without camera ot browsers which not supporting userMedia
imagePicker.addEventListener('change', e => {
  picture = e.target.files[0]
})

function openCreatePostModal() {
  createPostArea.style.display = 'block'
  initializeMedia()
  initializeLocation()
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
  imagePickerArea.style.display = 'none'
  videoPlayer.style.display = 'none'
  canvasElement.style.display = 'none'
  locationBtn.style.display = 'inline'
  locationLoader.style.display = 'none'
  captureButton.style.display = 'inline'
  if (videoPlayer.srcObject) {
    videoPlayer.srcObject.getVideoTracks().forEach(track => {
      track.stop()
    })
  }
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
  // const id = new Date().toISOString()
  // const postData = new FormData()
  // postData.append('id', id)
  // postData.append('title', inputTitle.value)
  // postData.append('location', inputLocation.title)
  // postData.append('file', picture, id + '.png')
  fetch('https://us-central1-pwagram-da146.cloudfunctions.net/storePost', {
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
          location: inputLocation.value,
          image: 'https://firebasestorage.googleapis.com/v0/b/pwagram-da146.appspot.com/o/san-francisco.jpg?alt=media&token=3ab72862-e880-4abf-93ea-3937581f14d7'
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