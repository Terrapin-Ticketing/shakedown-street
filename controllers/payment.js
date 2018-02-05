import config from 'config';

const UserApi = require('../controllers/user');
let userController = new UserApi();

const { secretKey } = config.stripe;
const stripe = require('stripe')(secretKey);

class Payment {
  async setStripe(user) {
    if (!user.stripeId) {
      let customer = await stripe.customers.create({
        email: user.email
      });
      user = await userController.setStripeId(user._id, customer.id);
    }
    return user;
  }

  async createCharge(user, token, total, metadata) {
    user = await this.setStripe(user);

    // let source = await stripe.customers.createSource(user.stripe.id, {
    //   source: token.id
    // });

    let source = token.card;
    if (config.env === 'development') {
      source = 'tok_visa';
    }
    let charge = await stripe.charges.create({
      amount: total,
      currency: 'usd',
      source,
      description: `Deposite made from ${user.email}`,
      metadata
    });
    await userController.addCharge(user._id, charge);
    return charge;
  }
}
export default Payment;
