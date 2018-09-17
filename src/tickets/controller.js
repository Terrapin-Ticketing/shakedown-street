import TicketModel from './model'
import Event from '../events/controller'
import User from '../users/controller'
const mongoose = require('../_utils/db').default

class TicketController {
  async find(query) {
    const tickets = await TicketModel.find(query)
    const returnTickets = []
    for (let ticket of tickets) {
      let event = await Event.getEventById(ticket.eventId)
      let user = await User.getUserById(ticket.ownerId)
      let x = ticket.toJSON()
      x.event = event
      x.user = user
      returnTickets.push(x)
    }
    return returnTickets
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
    const ticket = (await this.find({ _id: ticketId }))[0]
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
