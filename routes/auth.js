import config from 'config';
const jwt = require('jsonwebtoken');

import User from '../controllers/user';
let userCol = new User();

let { secret } = config.user;

function sendToken(res, user) {
  let { email, password, _id } = user;
  let token = jwt.sign({ email, password, _id }, secret); // password is salted, so this is fine
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
    } catch (e) {
      console.error(e);
      res.sendStatus(500);
    }
  });

  server.post('/signup', async(req, res) => {
    let { email, password, privateKey } = req.body;
    try {
      let user = await userCol.signup(email, password, privateKey);
      sendToken(res, user);
    } catch (e) {
      console.error(e);
      res.sendStatus(500);
    }
  });
};
