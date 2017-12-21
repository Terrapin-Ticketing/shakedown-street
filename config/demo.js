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




{
    "date" : "3/4/2018",
    "name" : "Columbus Brew Grass Festival",
    "urlSafe" : "BrewGrassFestival",
    "description" : "Greensky Bluegrass, Billy Strings, Larry Keel, Rumpke Mountain Boys, Kitchen Dwellers, Blue Moon Soup, Still Shine",
    "imageUrl" : "http://liveatthebluestone.com/wp-content/uploads/2017/12/24068068_528690924147257_2284411860158418511_n.png",
    "createrId" : ObjectId("5a3ab43dbc35b139aabbaff6"),
    "venue" : {
        "name" : "The Bluestone",
        "address" : "583 E Broad St",
        "city" : "Columbus",
        "state" : "OH",
        "zip" : "43215"
    }
}
