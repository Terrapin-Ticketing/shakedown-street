import Event from '../../events/controller'
import IntegrationInterface from '../IntegrationInterface'
import { post, get } from '../../_utils/http'

class MockIntegration extends IntegrationInterface {
  async login(apiKey, password, event) {
    // eid=56017677381
    const url = `https://www.eventbriteapi.com/v3/users/me/events/?token=${apiKey}`
    // const url = `https://www.eventbriteapi.com/v3/users/me/?token=${apiKey}`

    return event.auth.apiKey
  }

  async deactivateTicket(eventId, barcode) {
    // manual cycle through method
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

  async getTicketsByOrderId(orderId, event) {
    const apiKey = event.auth.apiKey;
    const response = await get(`https://www.eventbriteapi.com/v3/orders/${orderId}/?token=${apiKey}&expand=attendees`);
    return JSON.parse(response.body);
  }

  async isValidTicket(ticketId, event) {
    // use order number
    return ticketId.toString().match(/[a-zA-Z0-9]{5}/) && ticketId.toString().length === 5
  }

  async getTicketTypes(eventId) {
    /*
    BETTER PLACE TO GET IT FROM:
    */
    const event = await Event.getEventById(eventId)
    return event && event.ticketTypes
  }

  async getEventInfo(eventId) {
    // const x = await get(`https://www.eventbriteapi.com/v3/events/${event.externalEventId}/`, {
    //   headers: {
    //     'Authorization': `Bearer ${apiKey}`
    //   }
    // })

    const event = await Event.getEventById(eventId)
    return event
  }

  async getTicketInfo(ticketId) {
    //   curl -X POST   https://www.eventbriteapi.com/v3/events/{event_id}/ticket_classes/   -H 'Authorization: Bearer PERSONAL_OAUTH_TOKEN'   -H "Accept: application/json"
    // -d '{
    //       "ticket_class": {
    //           "name": "VIP",
    //           "quantity_total": 100,
    //           "cost": "USD,1000"
    //           }
    //       }'

    // https://www.eventbriteapi.com/v3/events/{event_id}/orders
    // -- returns barcodes
    // notice that /events became /orders

    // https://www.eventbriteapi.com/v3/orders/{order_id}/
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
