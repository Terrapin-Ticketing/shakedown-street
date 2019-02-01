import cheerio from 'cheerio'
import { post, get } from '../../_utils/http'

import IntegrationInterface from '../IntegrationInterface'
import Event from '../../events/controller'
import Ticket from '../../tickets/controller'

class MissionTixTicketIntegration extends IntegrationInterface {
  async login(eventId) {
    const event = await Event.getEventById(eventId)
    if (!event) return false
    const { auth, username, password } = await Event.getEventById(eventId)
    const res = await post({
      url: auth.loginUrl,
      json: {
        username,
        password
      },
      headers: {
        [auth.apiKeyName]: auth.apiKey,
        'Content-Type': 'application/json'
      }
    })
    const authKey = res.body.auth_key

    let cookie = ''
    for (let c in res.cookies) {
      cookie += `${c}=${res.cookies[c]}; `
    }
    return {
      [auth.apiKeyName]: auth.apiKey,
      'auth-key': authKey,
      cookie
    }
  }

  async isValidTicket(barcode, event) {
    const authHeaders = await this.login(event._id)
    const { auth, externalEventId } = event
    const url = `https://www.mt.cm/domefest/getTicketDetails?user_id=${auth.userId}&event_id=${externalEventId}&data=${barcode}&skip_save=true`
    const res = await get(url, {
      headers: authHeaders
    })
    const body = JSON.parse(res.body)

    const { status, result_msg, ticket_info } = body
    const pastScans = ticket_info && parseInt(ticket_info.passed_scans)

    const isValid = status === 'ok' && result_msg === 'Barcode is valid.' && pastScans === 0
    return isValid
  }

  async deactivateTicket(eventId, barcode) {
    const event = await Event.getEventById(eventId)
    if (!event) return false

    let isValid = await this.isValidTicket(barcode, event)
    if (!isValid) return false

    const authHeaders = await this.login(eventId)

    const { auth, externalEventId } = event
    const url = `https://www.mt.cm/domefest/getTicketDetails?user_id=${auth.userId}&event_id=${externalEventId}&data=${barcode}`
    const res = await get(url, {
      headers: authHeaders
    })
    const body = JSON.parse(res.body)
    const success = body.status === 'ok' && body.result_msg === 'Barcode is valid.'
    return success
  }

  async getTicketInfo() {
    return {
      type: 'General Admission',
      price: 10000
    }
  }

  async getEventInfo(eventId) {
    const event = await Event.getEventById(eventId)

    const { auth, externalEventId } = event
    const url = `https://www.mt.cm/domefest/details/${auth.userId}/${externalEventId}`

    const res = await get(url, {
      headers: await this.login(eventId)
    })
    if (!res.body) return false
    return JSON.parse(res.body)
  }

  async getInitialTokens(authHeaders) {
    // get form tokens from initial page
    const res = await get('https://www.mt.cm/testing-terrapin-ticketing-domefest-resale', {
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders
      }
    })
    const htmlDoc = res.body
    const $ = cheerio.load(htmlDoc)

    const form_id = $('input[name=form_id]').val()
    const form_token = $('input[name=form_token]').val()
    const form_build_id = $('input[name=form_build_id]').val()
    return {
      form_id,
      form_token,
      form_build_id
    }
  }

  async addTicketsToCart(eventId, authHeaders, nextTokens) {
    // add tickets to cart
    const res_addToCart = await post({
      method: 'post',
      url: `https://www.mt.cm/node/${eventId}/${eventId}`,
      form: {
        ...nextTokens,
        'add_to_cart_quantity[0][select]': 1,
        op: 'PURCHASE TICKETS'
      },
      headers: authHeaders
    })
    const $ = cheerio.load(res_addToCart.body)

    const form_id = $('input[name=form_id]').val()
    const form_token = $('input[name=form_token]').val()
    const form_build_id = $('input[name=form_build_id]').val()
    return {
      form_id,
      form_token,
      form_build_id
    }
  }

  async getCart(authHeaders) {
    const res_cart = await get('https://www.mt.cm/cart', {
      headers: authHeaders
    })

    const $ = cheerio.load(res_cart.body)
    const form_id = $('input[name=form_id]').val()
    const form_token = $('input[name=form_token]').val()
    const form_build_id = $('input[name=form_build_id]').val()
    return {
      form_id,
      form_token,
      form_build_id
    }
  }

  getTokens(htmlDoc) {
    const $ = cheerio.load(htmlDoc)

    const form_id = $('input[name=form_id]').val()
    const form_token = $('input[name=form_token]').val()
    const form_build_id = $('input[name=form_build_id]').val()

    return {
      form_id,
      form_token,
      form_build_id
    }
  }

  async issueTicket(event) {
    const { auth } = event
    const authHeaders = await this.login(event._id)

    let $, tokens
    const boxOffice = await get('https://www.mt.cm/admin/commerce/pos', {
      headers: authHeaders
    })
    tokens = this.getTokens(boxOffice.body)

    // add to cart
    await post({
      url: 'https://www.mt.cm/system/ajax',
      form: {
        ...tokens,
        input: auth.externalTicketId,
        _triggering_element_name: 'op',
        _triggering_element_value: 'Submit'
      },
      headers: authHeaders
    })

    const orderNumber = await get('https://www.mt.cm/admin/commerce/pos', {
      headers: authHeaders
    })

    $ = cheerio.load(orderNumber.body)
    const orderElm = $('.order-number.receipt-hide')
    const span = orderElm.children()[0]
    const orderId = span.children[0].data.replace('\n', '').replace(' ', '')

    tokens = this.getTokens(orderNumber.body)

    // comp order
    const compOrder = await post({
      url: 'https://www.mt.cm/admin/commerce/pos/ajax/payment_discount',
      headers: authHeaders
    })

    tokens = this.getTokens(JSON.parse(compOrder.body)[1].output)

    await post({
      url: 'https://www.mt.cm/admin/commerce/pos/ajax/payment_discount',
      form: {
        'amount': 0,
        'currency_code': 'USD',
        'payment_details[pos_discount][customer_name]': 'Terrapin',
        ...tokens,
        'op': 'Submit'
      },
      headers: authHeaders
    })

    const res_printTickets = await get(`https://www.mt.cm/checkout/${orderId}/complete`, {
      headers: authHeaders
    })

    $ = cheerio.load(res_printTickets.body)
    const viewTicketUrl = $('a.btn.btn-default.form-submit').attr('href')

    const res_viewTickets = await get(viewTicketUrl, {
      headers: authHeaders
    })

    $ = cheerio.load(res_viewTickets.body)

    const barcode = $('.qr-code-token').text()
    return barcode
  }
  // getTicketInfo(ticketId) { throw new Error('not implemented') } // all integrations should return same format for getTicketInfo
  // getTicketTypes(eventId) { throw new Error('not implemented') }

  async transferTicket(ticket, toUser) {
    if (!toUser || !ticket) return false
    const { eventId, barcode } = ticket

    const event = await Event.getEventById(eventId)
    if (!event) return false

    const newBarcode = await this.issueTicket(event, toUser, ticket.type)
    if (!newBarcode) return false

    const success = await this.deactivateTicket(eventId, barcode)
    if (!success) return false

    const newTicket = await Ticket.set(ticket._id, {
      ownerId: toUser._id,
      barcode: newBarcode,
      isForSale: false
    })

    return newTicket
  }
}


export default new MissionTixTicketIntegration()
