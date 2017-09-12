const jwt = require('jsonwebtoken');
// const errors = require('restify-errors');

const config = require('../config/default');
let { secret } = config.user;

const User = require('../controllers/user');
let user = new User();

function sendToken(res, user, next) {
  let { email, walletAddress, encryptedPrivateKey } = user;
  let token = jwt.sign({ email, walletAddress, encryptedPrivateKey }, secret);
  let expire = 1000 * 60 * 60 * 24 * 2;
  res.status(200)
    .cookie('cookieToken', token, { maxAge: expire })
    .json({ token });
  return next();
}

module.exports = (server) => {

  server.post('/login', (req, res, next) => {
    let { email, password } = req.body;
    user.getUser(email, password)
      .then((user) => sendToken(res, user, next))
      .catch((err) => {
        console.log('login err: ', err);
        res.send(err);
        return next();
      });
  });

  server.post('/register', (req, res, next) => {
    let { email, password } = req.body;
    return user.register(email, password)
      .then((user) => sendToken(res, user, next))
      .catch((err) => {
        console.log('register err: ', err);
        res.send(err);
        return next();
      });
  });

};
