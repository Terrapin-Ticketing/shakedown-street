import BidModel from './model'

class Bid {
  async place(placerId, price, ticketType, stripeToken) {
    const bid = await BidModel.create({ placerId, price, ticketType, stripeToken,
      date: Date.now()
    })
    return bid
  }

  async find(query) {
    const bids = await BidModel.find(query).populate(['placerId'])
    return bids
  }
}

export default new Bid()
