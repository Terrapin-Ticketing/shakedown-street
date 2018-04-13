import config from 'config'

import User from '../users/controller'

const { secretKey } = config.stripe
const stripe = require('stripe')(secretKey)

class StripeInterface {
  async setStripe(user) {
    if (!user.stripeId) {
      let customer = await stripe.customers.create({
        email: user.email
      })
      user = await User.setStripeId(user._id, customer.id)
    }
    return user
  }

  async createCharge(user, token, total, metadata) {
    user = await this.setStripe(user)

    let source = token.id
    if (config.env === 'development') {
      // source = 'tok_chargeDeclined';
      source = 'tok_visa'
    }
    let charge = await stripe.charges.create({
      amount: total,
      currency: 'usd',
      source,
      description: `Deposite made from ${user.email}`,
      metadata
    })
    await User.addCharge(user._id, charge)
    return charge
  }
}
export default new StripeInterface()
