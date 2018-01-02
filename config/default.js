let os = require('os');
let ifaces = os.networkInterfaces();
let infopass = process.env.INFO_PASS;
let PORT = 8080;

if (!infopass) throw new Error('INFO_PASS not set');

function getIpAddress() {
  let ipAddresses = [];
  Object.keys(ifaces).forEach(function(ifname) {
    let alias = 0;

    ifaces[ifname].forEach(function(iface) {
      if ('IPv4' !== iface.family || iface.internal !== false) {
        // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
        return;
      }

      if (alias >= 1) {
        // this single interface has multiple ipv4 addresses
        ipAddresses.push({ ifname, alias, address: iface.address});
      } else {
        // this interface has only one ipv4 adress
        ipAddresses.push({ ifname, address: iface.address});
      }
      ++alias;
    });
  });
  return ipAddresses;
}

let ipAddress = getIpAddress()[0].address;

module.exports = {
  'port': PORT,
  'domain': `http://${ipAddress}:${PORT}`,
  'env': 'development',
  'web3': {
    'httpProvider': `http://${ipAddress}:8545`
  },
  'stripe': {
    'secretKey': 'sk_test_uKIHGA1q5UfwysISFvt6nHto'
  },
  'user': {
    'secret': 'nershi4prez'
  },
  infopass,
  'clientDomain': `http://${ipAddress}:3000`
};
