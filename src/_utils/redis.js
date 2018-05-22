import redis from 'redis'
import config from 'config'
const client = redis.createClient()

function prefixNamespace(namespace) {
  return `${config.env.toUpperCase()}_${namespace}`
}

class RedisCli {
  async set(namespace, key, value, timeout) {
    await new Promise((resolve) => {
      if (!timeout) return client.hset(prefixNamespace(namespace), key, value, resolve)
      client.hset(prefixNamespace(namespace), String(key), String(value), 'EX', timeout, resolve)
    })
  }

  async get(namespace, key) {
    return await new Promise((resolve) => {
      client.hget(prefixNamespace(namespace), String(key), async(err, value) => {
        if (err || value === 'false') return resolve(false)
        return resolve(value)
      })
    })
  }

  async flushdb() {
    return await new Promise((resolve, reject) => {
      client.flushdb((err, succeeded) => {
        if (err) return reject(err)
        resolve(succeeded)
      })
    })
  }
}
export default new RedisCli()
