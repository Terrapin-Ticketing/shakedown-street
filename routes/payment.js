import config from 'config';
const jwt = require('jsonwebtoken');

import User from '../controllers/user';
let userCol = new User();

const { secretKey } = config.stripe;
const stripe = require('stripe')(secretKey);

module.exports = (server) => {
  server.post('/payment', async(req, res) => {
    if (!req.user) return res.sendStatus(401);
    // let { token, fees, qty, eventAddress } = req.body;

    // STRIPE: charge
    // await stripe.charges.create({
    //   amount: total,
    //   currency: 'usd',
    //   source: 'tok_visa', // token.card
    //   description: 'Charge for ethan.robinson@example.com'
    // });

    // let { email, password } = req.body;
    // try {
    //   let user = await userCol.getUser(email, password);
    //   res.send(200);
    // } catch (e) {
    //   console.error(e);
    //   res.sendStatus(500);
    // }
  });
};
