import Event from '../../events/controller'
import IntegrationInterface from '../IntegrationInterface'

class MockIntegration extends IntegrationInterface {
  async login(username, password, event) {
    return 'mock-session-key'
  }

  async deactivateTicket(eventId, barcode) {
    return true
  }

  async reactivateTicket(eventId, barcode) {
    return true
  }

  async issueTicket(event, user, ticketType) {
    var text = ''
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    for (let i = 0; i < 5; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return text
  }

  async isValidTicket(ticketId, event) {
    if (ticketId.toString().match(/[a-zA-Z0-9]{5}/) && ticketId.toString().length === 5) {
      return {
        id: 12345,
        price: 10,
        barcode: 'abc12345',
        type: 'General Admission',
        isForSale: true,
        descrip: 'blah',
        eventId: {
          name: 'Domefest',
          urlSafe: 'mockevent',
          startDate: '2018-03-04T01:00:00',
          _id: '5c5e441106e8b161e389c1ae',
          venue: {
            name: 'Legend Valley',
            address: '999 Fun Time',
            city: 'Theland',
            state: 'OH',
            zip: '43215'
          }
        }
      }
    }
  }

  async getTicketTypes(eventId) {
    /*
    BETTER PLACE TO GET IT FROM:
    */
    const event = await Event.getEventById(eventId)
    return event && event.ticketTypes
  }

  async getEventInfo(eventId) {
    const event = await Event.getEventById(eventId)
    return event
  }

  async getTicketInfo(ticketId) {
    return {
      id: ticketId,
      discrip: 'looks like i matter a lot',
      type: 'someType', // idk why we rely on this,
      price: 10
    }
  }

  // async transferTicket // on inteface
}
export default new MockIntegration()
