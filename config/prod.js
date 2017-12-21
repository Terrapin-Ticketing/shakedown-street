let stripeSecretKey = process.env.STRIPE_SK;
let jwtSecret = process.env.JWT_SECRET;
let infopass = process.env.INFO_PASS;

if (!stripeSecretKey) throw new Error('STRIPE_SK not set');
if (!jwtSecret) throw new Error('JWT_SECRET not set');
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
