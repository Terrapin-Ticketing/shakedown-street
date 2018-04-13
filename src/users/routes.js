import { sendToken } from '../_utils'
import { Email } from '../_utils/param-types'
import User from './controller'
import redis from '../_utils/redis'
import Emailer from './email'


export default {
  ['/signup']: {
    post: { // have to have this to have muiltiple routes under same name
      body: {
        email: Email,
        password: String
      },
      handler: async(req, res) => {
        const { email, password } = req.body
        const user = await User.createUser(email, password)
        if (!user) return res.send({ error: 'username already taken' })
        sendToken(res, user)
      }
    }
  },
  ['/login']: {
    post: {
      body: {
        email: Email,
        password: String
      },
      handler: async(req, res) => {
        const { email, password } = req.body
        const user = await User.login(email, password)
        if (!user) return res.send({ error: 'invalid email or password' })
        sendToken(res, user)
      }
    }
  },
  ['/set-password']: {
    post: {
      body: {
        email: Email
      },
      handler: async(req, res) => {
        const { email } = req.body
        const user = await User.getUserByEmail(email)
        if (!user) return res.send({ error: 'user doesnt exist'})
        const passwordChangeUrl = await User.requestChangePasswordUrl(email)
        await Emailer.sendChangePassword(email, passwordChangeUrl)
        res.send({ message: 'password change email sent' })
      }
    }
  },
  ['/set-password/:token']: {
    post: {
      body: {
        password: String
      },
      handler: async(req, res) => {
        const { token } = req.params
        const { password } = req.body
        const email = await redis.get('set-password', token)
        if (!email) return res.send({ error: 'invalid token' })
        const user = await User.changePassword(email, password)
        if (!user) return res.send({ error: 'user not found' })
        sendToken(res, user)
      }
    }
  },
  ['/check-token']: {
    post: {
      body: {
        token: String
      },
      handler: async(req, res) => {
        const { token } = req.body
        const email = await redis.get('set-password', token)
        return res.send({ isValidToken: !!email })
      }
    }
  }
}
