import bcrypt from 'bcrypt'
import uuidv1 from 'uuid/v4'
import { saltPassword } from './util'
import UserModel from './model'
import redis from '../_utils/redis'
import config from 'config'

class UserController {
  async createUser(email, password, firstName, lastName) {
    try {
      const user = await UserModel.create({
        email: email.toLowerCase(),
        password: saltPassword(password),
        firstName,
        lastName
      })
      return user
    } catch (e) {
      if (~e.message.indexOf('E11000 duplicate key')) return null
      throw e
    }
  }

  async login(email, password) {
    return await new Promise(async(resolve, reject) => {
      const user = await this.getUserByEmail(email)
      if (!user) return resolve(null)
      bcrypt.compare(password, user.password, (err, success) => {
        if (err) return reject(err)
        if (!success) return resolve(null)
        return resolve(user)
      })
    })
  }

  async getUserByEmail(email) {
    const user = await UserModel.findOne({
      email: email.toLowerCase()
    })
    return user
  }

  async getUserById(userId) {
    const user = await UserModel.findOne({ _id: userId })
    return user
  }

  async changePassword(email, password) {
    let lowercasedEmail = email.toLowerCase()
    let user = await UserModel.findOneAndUpdate({ email: lowercasedEmail }, {
      $set: {
        password: saltPassword(password)
      }
    }, { new: true })
    return user
  }

  async requestChangePasswordUrl(email) {
    const token = uuidv1()
    await redis.set('set-password', token, email)
    const passwordChangeUrl = `${config.clientDomain}/set-password/${token}`
    return passwordChangeUrl
  }

  async addCharge(userId, charge) {
    this.set(userId, {
      $push: {
        'stripe.charges': charge
      }
    })
  }

  async set(id, set) {
    const user = await UserModel.findOneAndUpdate({ _id: id }, {
      $set: set
    }, { new: true })
    return user
  }
}

export default new UserController()
