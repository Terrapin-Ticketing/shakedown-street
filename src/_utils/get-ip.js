let os = require('os')
let ifaces = os.networkInterfaces()

export default function getIpAddress() {
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
