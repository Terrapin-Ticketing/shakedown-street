// let stripeSecretKey = 'sk_test_uKIHGA1q5UfwysISFvt6nHto';
let stripeSecretKey = process.env.STRIPE_SK;
if (!stripeSecretKey) throw new Error('Missing STRIPE_SK');
// let jwtSecret = 'nershi4prez';
let jwtSecret = process.env.JWT_SECRET;
if (!stripeSecretKey) throw new Error('Missing JWT_SECRET');


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
