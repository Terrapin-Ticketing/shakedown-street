import { sendToken } from '../_utils'
import { Email } from '../_utils/param-types'
import User from './controller'
import redis from '../_utils/redis'
import Emailer from '../email'


export default {
  ['/users/:id']: {
    put: {
      handler: async(req, res) => {
        const { user } = req.props
        const { id } = req.params
        if (!user || String(user._id) !== String(id)) return res.status(401).send('Unautherized')
        const newUser = await User.set(id, req.body)
        if (!newUser) return res.status(404).send('User does not exist')
        sendToken(res, newUser)
      }
    }
  },
  ['/signup']: {
    post: { // have to have this to have muiltiple routes under same name
      body: {
        email: Email,
        password: String
      },
      handler: async(req, res) => {
        const { email, password } = req.body
        const user = await User.createUser(email, password)
        if (!user) return res.status(409).send('Username already taken')
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
        if (!user) return res.status(422).send('Invalid Email or Password')
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
        if (!user) return res.status(404).send('User doesnt exist')
        const passwordChangeUrl = await User.requestChangePasswordUrl(email)
        await Emailer.sendChangePassword(email, passwordChangeUrl)
        res.send({ message: 'Change password email email sent' })
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
        console.log('token/password: ', token, password)
        const email = await redis.get('set-password', token)
        console.log('email: ', email)
        if (!email) return res.status(404).send('invalid token')
        const user = await User.changePassword(email, password)
        console.log('user: ', user)
        if (!user) return res.status(404).send('User not found')
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
