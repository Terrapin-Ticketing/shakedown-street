/*eslint-disable */

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
}

export default IntegrationInterface
