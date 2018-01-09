let stripeSecretKey = 'sk_test_uKIHGA1q5UfwysISFvt6nHto';
let jwtSecret = 'nershi4prez';
let infopass = process.env.INFO_PASS;
let PORT = 8080;

if (!infopass) throw new Error('INFO_PASS not set');

module.exports = {
  'port': PORT,
  'env': 'demo',
  'domain': `http://localhost:${PORT}`,
  'web3': {
    'httpProvider': 'http://138.197.106.138:8545'
  },
  'stripe': {
    'secretKey': stripeSecretKey
  },
  'user': {
    'secret': jwtSecret
  },
  'session': {
    name: 'cherryGarcia'
  },
  infopass,
  'clientDomain': 'https://terrapintickets.io'
};
