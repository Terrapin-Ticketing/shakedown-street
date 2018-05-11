import path from 'path'
import config from 'config'
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
    const isValid = body.status === 'ok' && body.result_msg === 'Barcode is valid.'
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
    console.log(body)
    const success = body.status === 'ok' && body.result_msg === 'Barcode is valid.'
    return success
  }

  async getTicketInfo() {
    return {
      type: 'GA',
      price: 1000
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

  async issueTicket(event) {
    const eventId = event.externalEventId
    const authHeaders = await this.login(event._id)

    let orderId, res_payment
    do {
      let nextTokens = await this.getInitialTokens(authHeaders)

      nextTokens = await this.addTicketsToCart(eventId, authHeaders, nextTokens)
      if (nextTokens['form_id'] === 'pos_input_form') {
        console.log('no stock left')
        return false
      }

      // checkout cart
      const res_checkout = await post({
        url: 'https://www.mt.cm/cart',
        form: {
          ...nextTokens,
          'edit_quantity[0]': 1,
          op: 'Checkout'
        },
        headers: authHeaders,
        followRedirect: false
      })

      const checkoutUrl = res_checkout.headers.location
      orderId = path.basename(checkoutUrl.substring(8, checkoutUrl.length))

      // get checkout url
      const res_paymentForm = await get(checkoutUrl, {
        headers: authHeaders
      })
      let $ = cheerio.load(res_paymentForm.body)

      let form_id = $('input[name=form_id]').val()
      let form_token = $('input[name=form_token]').val()
      let form_build_id = $('input[name=form_build_id]').val()

      // add coupon to order
      await post({
        url: 'https://www.mt.cm/system/ajax',
        form: {
          form_build_id,
          form_id,
          form_token,
          _triggering_element_name: 'coupon_add',
          _triggering_element_value: 'Add coupon',
          'commerce_coupon[coupon_code]': 'terrapin1'
        },
        headers: authHeaders,
        followRedirect: false
      })

      res_payment = await post({
        url: `https://www.mt.cm/checkout/${orderId}`,
        form: {
          form_build_id,
          form_id,
          form_token,
          'customer_profile_billing[commerce_customer_address][und][0][country]': 'US',
          'customer_profile_billing[commerce_customer_address][und][0][name_line]': 'TERRAPIN',
          'customer_profile_billing[commerce_customer_address][und][0][thoroughfare]': 'TERRAPIN',
          'customer_profile_billing[commerce_customer_address][und][0][locality]': 'TERRAPIN',
          'customer_profile_billing[commerce_customer_address][und][0][administrative_area]': 'AZ',
          'customer_profile_billing[commerce_customer_address][und][0][postal_code]': 44444,
          'customer_profile_billing[field_name_to_print][und][0][value]': 'TERRAPIN',
          // 'customer_profile_shipping[commerce_customer_profile_copy]': 1,
          phone_number: 1,
          'commerce_payment[payment_method]': 'commerce_no_payment|commerce_payment_commerce_no_payment',
          op: 'PLACE YOUR ORDER'
        },
        headers: authHeaders,
        followRedirect: false
      })
    } while (res_payment.body)

    const res_printTickets = await get(`https://www.mt.cm/checkout/${orderId}/complete`, {
      headers: authHeaders
    })

    let $ = cheerio.load(res_printTickets.body)
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
    console.log('success', success)
    if (!success) return false

    const newTicket = await Ticket.set(ticket._id, {
      ownerId: toUser._id,
      barcode: newBarcode
    })

    return newTicket
  }
}


export default new MissionTixTicketIntegration()
