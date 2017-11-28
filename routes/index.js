const jwt = require('jsonwebtoken');
// const errors = require('restify-errors');

const config = require('config');
let { secret } = config.user;

const User = require('../controllers/user');
let user = new User();

const Event = require('../controllers/event');
let event = new Event();

function sendToken(res, user) {
  let { email, walletAddress, encryptedPrivateKey } = user;
  let token = jwt.sign({ email, walletAddress, encryptedPrivateKey }, secret);
  let expire = 1000 * 60 * 60 * 24 * 2;
  return res.status(200)
    .cookie('cookieToken', token, { maxAge: expire, httpOnly: false })
    .send({ token });
}

module.exports = (server) => {
  server.post('/login', (req, res) => {
    let { email, password } = req.body;
    user.getUser(email, password)
      .then((user) => sendToken(res, user))
      .catch((err) => {
        console.log('login err: ', err);
        res.send(500);
      });
  });

  server.post('/signup', (req, res, next) => {
    let { email, password, privateKey } = req.body;
    return user.signup(email, password, privateKey)
      .then((user) => {
        return sendToken(res, user, next);
      })
      .catch((err) => {
        console.log('signup err: ', err);
        res.send(500);
      });
  });

  server.get('/event/:eventAddress', (req, res) => {
    let { eventAddress } = req.params;
    console.log('eventAddress', eventAddress);
    return event.getEventInfo(eventAddress)
      .then((event) => {
        return res.send({ event });
      })
      .catch((err) => {
        res.sendStatus(500);
      });
  });

};
