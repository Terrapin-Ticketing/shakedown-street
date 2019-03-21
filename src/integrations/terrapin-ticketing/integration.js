import Event from '../../events/controller'
import Ticket from '../../tickets/controller'

import IntegrationInterface from '../IntegrationInterface'
import redis from '../../_utils/redis'

class TerrapinTicketingIntegration extends IntegrationInterface {
  async login(username, password, event) {
    if (!username, !password, !event.loginUrl) { return false }

    const res = {
      cookies: {
        session_id: 'jerryman'
      }
    }

    const newSessionId = res.cookies['session_id']
    await redis.set('terrapin-ticketing', 'sessionId', newSessionId, 60*60)
    return newSessionId
  }

  async deactivateTicket(eventId, barcode) {
    const event = await Event.getEventById(eventId)
    if (!event) return false
    let ticketInfo = await this.getTicketInfo(barcode, event)
    if (!ticketInfo || ticketInfo['Status'] !== 'active') return false
    const success = true
    return success
  }

  async issueTicket(event, user, ticketType) {
    if (!event || !user || !ticketType) return false
    return Math.random() * 1000000000000000
  }

  async isValidTicket(ticketId, event) {
    // return false
    return {
      'isRedeemed': false,
      'isForSale': false,
      'type': 'VIP 2-Day Pass',
      'barcode': ticketId,
      'ownerId': '5b2c4b6bed1c748f518531ec',
      'dateIssued': '2018-06-28T12:10:57.149Z',
      'eventId': '5b29c4bafad70a7b4eb282e4',
      'price': 1000
    }
  }


  async _getTickets(event) {
    // something here
    return {

    }
  }

  async getTicketInfo(ticketId, event) {
    let tickets = await this._getTickets(event)
    return tickets[ticketId]
  }

  async getTicketTypes(eventId) {
    const event = await Event.getEventById(eventId)
    return event && event.ticketTypes
  }

  async getEventInfo(eventId) {
    const event = await Event.getEventById(eventId)
    return event
  }

  async transferTicket(ticket, toUser) {
    if (!toUser || !ticket) return false
    const { eventId, barcode } = ticket
    const success = await this.deactivateTicket(eventId, barcode)
    if (!success) return false
    const event = await Event.getEventById(eventId)
    if (!event) return false
    const newBarcode = await this.issueTicket(event, toUser, ticket.type)
    if (!newBarcode) return false

    const newTicket = await Ticket.set(ticket._id, {
      ownerId: toUser._id,
      barcode: newBarcode
    })

    return newTicket
  }
}
export default new TerrapinTicketingIntegration()