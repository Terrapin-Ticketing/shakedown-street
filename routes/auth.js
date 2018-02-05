import config from 'config';
const jwt = require('jsonwebtoken');

import User from '../controllers/user';
let userCol = new User();

let { secret } = config.user;
// let secure = config.env !== 'development';

function sendToken(res, user) {
  let { email, password, _id, payout } = user;
  let token = jwt.sign({ email, password, _id, payout }, secret); // password is salted, so this is fine
  let expire = 1000 * 60 * 60 * 24 * 2;
  return res.status(200)
    .cookie('cookieToken', token, {
      maxAge: expire,
      httpOnly: false
    })
    .send({ token });
}

module.exports = (server) => {
  server.post('/login', async(req, res) => {
    let { email, password } = req.body;
    try {
      let user = await userCol.loginUser(email, password);
      sendToken(res, user);
    } catch (e) {
      console.error(e);
      res.sendStatus(500);
    }
  });

  server.post('/signup', async(req, res) => {
    let { email, password } = req.body;
    try {
      let user = await userCol.signup(email, password);
      sendToken(res, user);
    } catch (e) {
      console.error(e);
      res.sendStatus(500);
    }
  });

  server.post('/user/:id/payout', async(req, res) => {
    let { id } = req.params;
    if (!req.user || req.user._id !== id) return res.sendStatus(401);
    let { payoutMethod, payoutValue } = req.body;
    console.log(req.body);
    try {
      let user = await userCol.updatePayoutMethod(id, payoutMethod, payoutValue);
      if (!user) return res.sendStatus(403);
      sendToken(res, user);
    } catch (e) {
      console.error(e);
      res.sendStatus(500);
    }
  });

  server.post('/set-password', async(req, res) => {
    let { email } = req.body;
    try {
      await userCol.requestPasswordChange(email);
      res.sendStatus(200);
    } catch (e) {
      console.error(e);
      res.sendStatus(500);
    }
  });

  server.post('/set-password/:token', async(req, res) => {
    let { token } = req.params;
    let { password } = req.body;
    try {
      let user = await userCol.changePassword(token, password);
      console.log('set-password user:', user);
      if (user.error) return res.send({ error: user.error });
      return sendToken(res, user);
    } catch (e) {
      console.error(e);
      res.sendStatus(500);
    }
  });

  server.post('/check-token', async(req, res) => {
    let { token } = req.body;
    try {
      let email = await userCol.getEmailFromToken(token);
      return res.send({ isValidToken: !!email });
    } catch (e) {
      console.error(e);
      res.sendStatus(500);
    }
  });
};
