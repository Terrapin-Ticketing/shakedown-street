/*eslint-disable */
import Event from '../events/controller'
import Ticket from '../tickets/controller'

class IntegrationInterface {
  login(username, password) { throw new Error('not implemented') }
  deactivateTicket(eventId, barcode) { throw new Error('not implemented') }
  issueTicket(event, user, type) { throw new Error('not implemented') }
  isValidTicket(ticketId) { throw new Error('not implemented') }
  getTicketInfo(ticketId) { throw new Error('not implemented') } // all integrations should return same format for getTicketInfo
  // getEventInfo can be used to hit the event's api if we want live data
  getEventInfo(eventId) { throw new Error('not implemented') } // all integrations should return same format for getEventInfo
  getTicketTypes(eventId) { throw new Error('not implemented') }
  transferTicket(ticket, toUser) { throw new Error('not implemented') }
  async transferTicket(ticket, toUser) {
    if (!toUser || !ticket) return false
    const { eventId, barcode } = ticket
    const success = await this.deactivateTicket(eventId, barcode)
    if (!success) return false
    const event = await Event.getEventById(eventId)
    if (!event) return false
    const newBarcode = await this.issueTicket(event, toUser, ticket.type)
    if (!newBarcode) { // if issue didn't work, reactiate old ticket
      await this.reactivateTicket(eventId, barcode)
      return false
    }

    const newTicket = await Ticket.set(ticket._id, {
      ownerId: toUser._id,
      barcode: newBarcode,
      isForSale: false
    })

    return newTicket
  }
}

export default IntegrationInterface
