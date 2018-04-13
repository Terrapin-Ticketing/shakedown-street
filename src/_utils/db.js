import mongoose from 'mongoose'
import bluebird from 'bluebird'
import config from 'config'
let ready
mongoose.connect(`mongodb://localhost/${config.env}_terrapin`, { promiseLibrary: bluebird }, () => {
  ready = true
})
mongoose.connection.on('error', console.error.bind(console, 'connection error:'))

mongoose.dropCollection = async(name) => {
  while (!ready) {
    await new Promise((resolve) => {
      setTimeout(() => {
        resolve()
      }, 1000)
    })
  }
  const data = await new Promise((resolve, reject) => {
    mongoose.connection.db.listCollections({name}).next((err, data) => {
      if (err) return reject(err)
      resolve(data)
    })
  })
  if (!data || !mongoose.connection.collections[name]) return
  await new Promise((resolve, reject) => {
    mongoose.connection.collections[name].drop((err) => {
      if (err) return reject(err)
      resolve()
    })
  })
}

export default mongoose
