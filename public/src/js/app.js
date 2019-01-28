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
  // This is way to show notification from sw
  // But this is another way to show notification from js -> new Notification(title, options)
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
        // key from web-push lib
        const vapidPublicKey = 'BD31uob5lB2zQWANQr_4ViqhFmdw7KJmK-WmDGgfHEu4jsQqvU9uDdTlsONYqu0XpyWdy11JOVEia4e44l-oMLE'
        const convertedVapidPublicKey = urlBase64ToUnit8Array(vapidPublicKey)
        return swreg.pushManager.subscribe({
          userVisibleOnly: true,
          // Below need to set up public key from wep-push lib, and set up function
          applicationServerKey: convertedVapidPublicKey
        })
          .then((newSub) => {
            // Here we received new subscription from device and add it to firebase database
            // return fetch('https://pwagram-da146.firebaseio.com/subscriptions.json')
            // With POST and body of JSON.stringify(newSub)
            // then need to subscribe in sw on push event and call push notification when in triggered
            return fetch('https://pwagram-da146.firebaseio.com/subscriptions.json', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify(newSub)
            })
          })
          .then(res => {
            if (res.ok) {
              displayNotification()
            }
          })
          .catch(error => {
            console.log(error)
          })
      } else {
        // We have a subscription
      }
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