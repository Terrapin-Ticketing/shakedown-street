import PayoutModel from './model'

class Payout {
  async create(vals) {
    const payout = await PayoutModel.create(vals)
    return payout
  }

  async find(query) {
    const payout = await PayoutModel.find(query)
    return payout
  }
}

export default new Payout()
