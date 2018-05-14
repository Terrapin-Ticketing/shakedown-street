import TransferModel from './model'

class Transfers {
  async create(vals) {
    const transfer = await TransferModel.create(vals)
    return transfer
  }

  async find(query) {
    const transfers = await TransferModel.find(query)
    return transfers
  }
}

export default new Transfers()
