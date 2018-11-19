var shareImageButton = document.querySelector('#share-image-button')
var createPostArea = document.querySelector('#create-post')
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn')

function openCreatePostModal() {
  createPostArea.style.display = 'block'

  // checking if installing banner are existing, and show it when we need
  if (deferredPrompt) {
    deferredPrompt.prompt()
    deferredPrompt.userChoice.then(choiceResult => {
      console.log(choiceResult.outcome)
      if (choiceResult.outcome === 'dismissed') {
        console.log('User cancelled installation')
      } else {
        console.log('User added to home screen')
      }

      deferredPrompt = null
    })
  }
}

function closeCreatePostModal() {
  createPostArea.style.display = 'none'
}

shareImageButton.addEventListener('click', openCreatePostModal)

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal)
