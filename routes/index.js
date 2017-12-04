const jwt = require('jsonwebtoken');
// const errors = require('restify-errors');

const config = require('config');
let { secret } = config.user;

const User = require('../controllers/user');
let userCol = new User();

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
  server.post('/login', async(req, res) => {
    let { email, password } = req.body;
    try {
      let user = await userCol.getUser(email, password);
      sendToken(res, user);
    } catch (err) {
      console.log('login err: ', err);
      res.send(500);
    }
  });

  server.post('/signup', async(req, res, next) => {
    let { email, password, privateKey } = req.body;
    try {
      let user = await userCol.signup(email, password, privateKey);
      sendToken(res, user, next);
    } catch (err) {
      console.log('signup err: ', err);
      res.send(500);
    }
  });

  server.get('/event/:id', async(req, res) => {
    let { id } = req.params;
    console.log('id', id);
    try {
      let event = await event.getEventInfo(id);
      res.send({ event });
    } catch (e) {
      res.sendStatus(500);
    }
  });

};
