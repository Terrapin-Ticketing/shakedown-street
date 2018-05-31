import TransferModel from './model'

class Transfer {
  async create(vals) {
    const transfer = await TransferModel.create(vals)
    return transfer
  }

  async find(query) {
    const transfers = await TransferModel.find(query).populate(['ticketId', 'senderId', 'recieverId', 'eventId'])
    return transfers
  }
}

export default new Transfer()
