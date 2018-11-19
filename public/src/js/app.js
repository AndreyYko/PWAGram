let deferredPrompt

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