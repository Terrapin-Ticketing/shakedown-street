import _ from 'lodash'
import Event from '../../events/controller'
import IntegrationInterface from '../IntegrationInterface'
import { post, get } from '../../_utils/http'

class EventbriteIntegration extends IntegrationInterface {
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
    return '916100082'
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
    return !!(await this.getTicketById(barcode, event))
  }

  async getOrderByBarcode(barcode, event) {
    const apiKey = await this.login(event)
    const getOrdersPage = async() => {
      const res = await get(`https://www.eventbriteapi.com/v3/events/${event.externalEventId}/orders?token=${apiKey}`)
      return JSON.parse(res.body)
    }
    let ordersPage = await getOrdersPage()
    do {
      for (let order of ordersPage.orders) {
        order = await this.getOrderById(order.id, event)
        for (const t of order.tickets) {
          if (t.barcodes.find(bc => bc.barcode === barcode)) return order
        }
      }
      ordersPage = await getOrdersPage()
    } while (ordersPage.pagination.has_more_items)
    return false
  }

  async getTicketById(barcode, event, orderId=null) {
    const order = orderId ? await this.getOrderById(orderId, event) : await this.getOrderByBarcode(barcode, event)
    if (!order || !order.tickets) return false
    for (const t of order.tickets) {
      if (t.barcodes.find(bc => bc.barcode === barcode)) return t
    }
    return false
  }

  async getTicketTypes(event) {
    const apiKey = await this.login(event)
    const res = await get(`https://www.eventbriteapi.com/v3/events/${event.externalEventId}/ticket_classes?token=${apiKey}`)
    const ticketTypes = JSON.parse(res.body)
    return ticketTypes.ticket_classes
  }

  async getEventInfo(event) {
    const apiKey = await this.login(event)
    const res = await get(`https://www.eventbriteapi.com/v3/events/${event.externalEventId}/?token=${apiKey}`)
    const eventbriteEvent = JSON.parse(res.body)
    return eventbriteEvent
  }

  async getTicketInfo(barcode, event) {
    const ticket = await this.getTicketById(barcode, event)
    return {
      id: ticket.id,
      price: ticket.costs.gross.value,
      ticketTypes: ticket.costs,
      checkedIn: ticket.checked_in,
      status: ticket.status,
      orderId: ticket.order_id,
      type: ticket.ticket_class_name,
      typeId: ticket.ticket_class_id
    }
  }
}
export default new EventbriteIntegration()
