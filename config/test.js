require('dotenv').config() // doesn't return anything

let os = require('os')
let ifaces = os.networkInterfaces()
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

function getIpAddress() {
  let ipAddresses = []
  Object.keys(ifaces).forEach(function(ifname) {
    let alias = 0

    ifaces[ifname].forEach(function(iface) {
      if ('IPv4' !== iface.family || iface.internal !== false) {
        // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
        return
      }

      if (alias >= 1) {
        // this single interface has multiple ipv4 addresses
        ipAddresses.push({ ifname, alias, address: iface.address})
      } else {
        // this interface has only one ipv4 adress
        ipAddresses.push({ ifname, address: iface.address})
      }
      ++alias
    })
  })
  return ipAddresses
}
