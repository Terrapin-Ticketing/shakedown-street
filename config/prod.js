require('dotenv').config() // doesn't return anything

let infopass = process.env.INFO_PASS
let PORT = 8080

if (!infopass) throw new Error('INFO_PASS not set')

module.exports = {
  port: PORT,
  domain: `http://localhost:${PORT}`,
  env: 'prod',
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY
  },
  jwtSecret: process.env.JWT_SECRET,
  infopass,
  clientDomain: 'https://terrapintickets.io'
}
