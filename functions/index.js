const path = require('path')
const os = require('os')
const fs = require('fs')
const { inspect } = require('util')
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const cors = require('cors')({ origin: true })
const webPush = require('web-push')
const Busboy = require('busboy')
const UUID = require('uuid-v4')
const { Storage } = require('@google-cloud/storage')

const serviceAccount = require('./pwa-fb-key.json')

const gcconfig = {
  projectId: 'pwagram-da146',
  keyFilename: 'pwa-fb-key.json'
}

const gcs = new Storage(gcconfig)

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

// For sending web notification we need to install web-push lib (for node js)
// then need to generate vapid key for create a push subscription on front-end side
// and send notification from back-end for keys.

// Keys for binding push notification with our front-end
const vapidPublicKey = 'BD31uob5lB2zQWANQr_4ViqhFmdw7KJmK-WmDGgfHEu4jsQqvU9uDdTlsONYqu0XpyWdy11JOVEia4e44l-oMLE'
const vapidPrivateKey = 'UcYdIlo0dHA00SB0xLnLsdXP79S6jiau8FKH_2Td_Nk'

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://pwagram-da146.firebaseio.com/'
})

exports.storePost = functions.https.onRequest((request, response) => {
  cors(request, response, () => {
    admin.database().ref('posts').push({
      id: request.body.id,
      title: request.body.title,
      location: request.body.location,
      image: request.body.image
    })
      .then(() => {
        webPush.setVapidDetails('mailto:andriy.v.halushka@gmail.com', vapidPublicKey, vapidPrivateKey)
        return admin.database().ref('subscriptions').once('value')
      })
      .then(subscriptions => {
        // On this step, we get all device subscriptions from db above
        // And send to all subscriptions push request
        subscriptions.forEach(sub => {
          // We can use pushConfig = sub.val(), but for example
          // Because some another push libraries can be different
          // And pushConfig must be like below
          const pushConfig = {
            endpoint: sub.val().endpoint,
            keys: {
              auth: sub.val().keys.auth,
              p256dh: sub.val().keys.p256dh
            }
          }

          webPush.sendNotification(pushConfig, JSON.stringify({ title: 'New Post!', content: request.body.title }))
            .catch(error => console.log(error))
        })
        return response.status(201).json({ message: 'Data stored', id: request.body.id })
      })
      .catch(error => {
        response.status(500).json({ error })
      })
  })
})


// Reading FormData with Busboy library and uploading image to firebase
exports.storePostData = functions.https.onRequest((request, response) => {
  cors(request, response, () => {
    const uuid = UUID()
    // Using busboy library for reading formData from our front-end
    // And upload image to firebase (google cloud storage)
    const busboy = new Busboy({ headers: request.headers })
    const tmdir = os.tmpdir()

    const fields = {}
    let image = {
      fieldname: null,
      filename: null,
      filepath: null,
      type: null
    }

    busboy.on('field', (fieldname, val) => {
      fields[fieldname] = val
    })

    let writeImage = null

    busboy.on('file', (fieldname, file, filename, unicode, mimetype) => {
      const filepath = path.join(tmdir, filename)
      image.fieldname = fieldname
      image.filename = filename
      image.filepath = filepath
      image.type = mimetype

      const writeStream = fs.createWriteStream(filepath)
      file.pipe(writeStream)

      writeImage = () => {
        return new Promise((resolve, reject) => {
          file.on('end', () => {
            writeStream.end()
          })
          writeStream.on('finish', resolve)
          writeStream.on('error', reject)
        })
      }
    })

    busboy.on('finish', () => {
      writeImage
        .then(() => {
          return fs.unlinkSync(image.filepath)
        })
        .catch(error => {
          console.log(error)
        })
    })

    busboy.end(request.rawBody)

    if (fields && image) {
      // Here after parsing we received all fields and files from our formData
      // And can make request to server
      // Get a GCS bucket (our storage in firebase)
      const bucket = gcs.bucket('pwagram-da146.appspot.com')
      // Then we upload image to GCS bucket
      bucket.upload(image.filepath, {
          uploadType: 'media',
          metadata: {
            metadata: {
              contentType: image.type,
              firebaseStorageDownloadTokens: uuid
            }
          }
        }, (error, file) => {
          if (!error) {
            // Now, when image was uploaded, we can use formidable fields, to set new post to db
            admin.database().ref('posts').push({
              id: fields.id,
              title: fields.title,
              location: fields.location,
              // Default link to storage
              image: 'https://firebasestorage.googleapis.com/v0/b/' + bucket.name + '/o/' + image.filename + '?alt=media&token=' + uuid
            })
              .then(() => {
                webPush.setVapidDetails('mailto:andriy.v.halushka@gmail.com', vapidPublicKey, vapidPrivateKey)
                return admin.database().ref('subscriptions').once('value')
              })
              .then(subscriptions => {
                // On this step, we get all device subscriptions from db above
                // And send to all subscriptions push request
                subscriptions.forEach(sub => {
                  // We can use pushConfig = sub.val(), but for example
                  // Because some another push libraries can be different
                  // And pushConfig must be like below
                  const pushConfig = {
                    endpoint: sub.val().endpoint,
                    keys: {
                      auth: sub.val().keys.auth,
                      p256dh: sub.val().keys.p256dh
                    }
                  }
                  // We also can send URL property with post id, or something else
                  // And handle it on sw subscriptions, so we can open page with correct link
                  webPush.sendNotification(pushConfig, JSON.stringify({ title: 'New Post!', content: request.body.title }))
                    .catch(error => console.log(error))
                })
                return response.status(201).json({ message: 'Data stored', id: fields.id })
              })
              .catch(error => {
                response.status(500).json({ error })
              })
          } else {
            console.log(error)
            response.status(400).json({ error })
          }
        })
    } else {
      response.status(404).json({ message: 'Not found' })
    }
  })
})
