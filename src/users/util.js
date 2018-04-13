import bcrypt from 'bcrypt'

export function saltPassword(password) {
  let salt = bcrypt.genSaltSync(10)
  return bcrypt.hashSync(password, salt)
}
