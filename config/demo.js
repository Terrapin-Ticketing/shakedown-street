let stripeSecretKey = 'sk_test_uKIHGA1q5UfwysISFvt6nHto';
let jwtSecret = 'nershi4prez';
let infopass = process.env.INFO_PASS;

if (!infopass) throw new Error('INFO_PASS not set');

module.exports = {
  'port': 8080,
  'env': 'demo',
  'domain': 'http://localhost:8080',
  'web3': {
    'httpProvider': 'http://138.197.106.138:8545'
  },
  'stripe': {
    'secretKey': stripeSecretKey
  },
  'user': {
    'secret': jwtSecret
  },
  infopass,
  'clientDomain': 'https://terrapintickets.io'
};
