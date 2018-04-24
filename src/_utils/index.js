import jwt from 'jsonwebtoken'
import { jwtSecret } from 'config'
import __get from 'lodash.get'
export const _get = __get

import __set from 'lodash.set'
export const _set = __set

const expire = 1000 * 60 * 60 * 24 * 2
export function sendToken(res, user) {
  const token = createJWT(user)
  return res.status(200)
    .cookie('cookieToken', token, {
      maxAge: expire,
      httpOnly: false
    })
    .send({ token })
}

export function isEmptyObject(obj) {
  return Object.keys(obj).length === 0 && obj.constructor === Object
}

export function createJWT(user) {
  const { email, password, _id, payout } = user
  const token = jwt.sign({ email, password, _id, payout }, jwtSecret) // password is salted, so this is fine
  return token
}
