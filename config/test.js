require('dotenv').config() // doesn't return anything
import getIpAddress from '../src/_utils/get-ip'

let infopass = process.env.INFO_PASS
let PORT = 8080

if (!infopass) throw new Error('INFO_PASS not set')

let ipAddress = getIpAddress()[0].address

module.exports = {
  port: PORT,
  domain: `http://${ipAddress}:${PORT}`,
  env: 'test',
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY
  },
  jwtSecret: process.env.JWT_SECRET,
  infopass,
  clientDomain: `http://${ipAddress}:3000`
}
