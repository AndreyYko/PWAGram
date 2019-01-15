// Polyfills to provide promises for old browsers
if (!window.Promise) {
  window.Promise = Promise
}

let deferredPrompt
const enableNotificationsButtons = document.querySelectorAll('.enable-notifications')

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .then(() => console.log('Service worker registered'))
}

window.addEventListener('beforeinstallprompt', e => {
  console.log('beforeinstallprompt fired')
  deferredPrompt = e
  return false
})

function displayNotification () {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(sw => {
        sw.showNotification('Successfully subscribed! (From SW)', {
          body: 'You successfully subscribed to our Notification service!',
          icon: '/src/images/icons/app-icon-96x96.png',
          image: '/src/images/sf-boat.jpg',
          dir: 'ltr',
          lang: 'en-US', // BCP 47
          vibrate: [100, 50, 200],
          badge: '/src/images/icons/app-icon-96x96.png',
          tag: 'confirm-notification',
          renotify: true,
          actions: [
            {
              action: 'confirm',
              title: 'Okay',
              icon: '/src/images/icons/app-icon-96x96.png'
            },
            {
              action: 'cancel',
              title: 'Cancel',
              icon: '/src/images/icons/app-icon-96x96.png'
            }
          ]
        })
      })
  }
}

function configurePushSub () {
  let swreg
  navigator.serviceWorker.ready
    .then(sw => {
      swreg = sw
      return sw.pushManager.getSubscription()
    })
    .then(sub => {
      if (!sub) {
        // Create a new subscription
        return swreg.pushManager.subscribe({
          userVisibleOnly: true,
          // Then need to set up private key from wep-push lib, and set up function, but firebase is not working
        })
      } else {
        // We have a subscription
      }
    })
    .then((newSub) => {
      // Here we received new subscription from device and add it to firebase database
      // return fetch('https://pwagram-da146.firebaseio.com/subscriptions.json')
      // With POST and body of JSON.stringify(newSub)
      // then need to subscribe in sw on push event and call push notification when in triggered
    })
}

function askForNotificationPermission () {
  Notification.requestPermission(result => {
    if (result !== 'granted') {
      console.log('No notification permission granted!')
    } else {
      console.log('User choice are granted')
      // displayNotification()
      configurePushSub()
    }
  })
}

if ('Notification' in window && 'serviceWorker' in navigator) {
  enableNotificationsButtons.forEach(button => {
    button.style.display = 'inline-block'
    button.addEventListener('click', askForNotificationPermission)
  })
}