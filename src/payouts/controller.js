import PayoutModel from './model'
import User from '../users/controller'

class Payout {
  async create(vals) {
    const payout = await PayoutModel.create(vals)
    return payout
  }

  async find(query) {
    const payouts = await PayoutModel.find(query).populate(['ticketId', 'sellerId', 'buyerId', 'eventId'])
    const userInfoPayouts = []
    for (let po of payouts) {
      const buyer = await User.getUserById(po.buyerId)
      const jsonPo = po.toJSON()
      userInfoPayouts.push({
        ...jsonPo,
        payout: buyer.payout
      })
    }
    return userInfoPayouts
  }

  async setIsPaidById(payoutId) {
    const payout = await PayoutModel.findOneAndUpdate({ _id: payoutId }, {
      $set: {
        isPaid: true
      }
    }, { new: true })
    return payout
  }
}

export default new Payout()
