import TicketModel from './model'
const mongoose = require('../_utils/db').default

class TicketController {
  async find(query) {
    const tickets = await TicketModel.find(query).populate('eventId').populate('ownerId')
    return tickets
  }

  async getTicketByBarcode(barcode) {
    const ticket = (await this.find({ barcode }))[0]
    return ticket
  }

  async createTicket(eventId, userId, barcode, price, type) {
    const newTicket = await TicketModel.create({
      barcode,
      ownerId: mongoose.mongo.ObjectId(userId),
      dateIssued: new Date(),
      eventId,
      price,
      type
    })
    return newTicket && await this.getTicketById(newTicket._id)
  }

  async getTicketById(ticketId) {
    const ticket = await TicketModel.findOne({ _id: ticketId }).populate('eventId').populate('ownerId')
    return ticket
  }

  async set(id, set) {
    const ticket = await TicketModel.findOneAndUpdate({ _id: id }, {
      $set: set
    }, { new: true })
    return ticket && await this.getTicketById(ticket._id)
  }
}
export default new TicketController()
