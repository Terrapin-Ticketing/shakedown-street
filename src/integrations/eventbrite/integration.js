import _ from 'lodash'
import Event from '../../events/controller'
import IntegrationInterface from '../IntegrationInterface'
import { post, get } from '../../_utils/http'

class MockIntegration extends IntegrationInterface {
  async login(event) {
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

  async getOrderById(orderId, event) {
    const apiKey = await this.login(event);
    const res = await get(`https://www.eventbriteapi.com/v3/orders/${orderId}/?token=${apiKey}&expand=attendees`);
    const order = JSON.parse(res.body)
    return {
      orderId,
      name: order.name,
      tickets: order.attendees
    }
  }

  async isValidTicket(barcode, event) {
    const apiKey = await this.login(event);
    const getOrdersPage = async () => {
      const res = await get(`https://www.eventbriteapi.com/v3/events/${event.externalEventId}/orders?token=${apiKey}`)
      return JSON.parse(res.body)
    }
    let ordersPage = await getOrdersPage()
    let isFound = false
    do {
      for (let order of ordersPage.orders) {
        if (isFound) break;
        order = await this.getOrderById(order.id, event);
        const barcodes = _.flatten(order.tickets.map(t => t.barcodes.map(a => a.barcode)))
        isFound = !!barcodes.find(bc => bc === barcode);
      }
      ordersPage = await getOrdersPage()
    } while (ordersPage.pagination.has_more_items && !isFound)
    return isFound
  }

  async getTicketTypes(eventId) {
    // const apiKey = await this.login(event);
    // const res = await get(`https://www.eventbriteapi.com/v3/events/${event.externalEventId}/?token=${apiKey}`);
    // const event = JSON.parse(res.body)
    // console.log('event', event)
    // BETTER PLACE TO GET IT FROM:
    // */
    // const event = await Event.getEventById(eventId)
    // return event && event.ticketTypes
  }

  async getEventInfo(event) {
    const apiKey = await this.login(event);
    const res = await get(`https://www.eventbriteapi.com/v3/events/${event.externalEventId}/?token=${apiKey}`);
    const eventbriteEvent = JSON.parse(res.body)
    return eventbriteEvent
  }

  async getTicketInfo(ticketId) {
    //   curl -X POST   https://www.eventbriteapi.com/v3/events/{event_id}/ticket_classes/   -H 'Authorization: Bearer apiKey'   -H "Accept: application/json"
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
