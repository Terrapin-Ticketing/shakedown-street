import config from 'config';
const jwt = require('jsonwebtoken');

import User from '../controllers/user';
let userCol = new User();

let { secret } = config.user;

function sendToken(res, user) {
  let { email } = user;
  let token = jwt.sign({ email }, secret);
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
};
