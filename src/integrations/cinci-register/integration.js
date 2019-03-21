import url from 'url'
import Event from '../../events/controller'
import Ticket from '../../tickets/controller'

import IntegrationInterface from '../IntegrationInterface'
import { post, get } from '../../_utils/http'
import redis from '../../_utils/redis'

import csv from 'csvtojson'

class CinciRegisterIntegration extends IntegrationInterface {
  async login(username, password, event) {
    // const sessionId = await redis.get('cinci-register', 'sessionId')
    // if (sessionId || config.env !== 'test') return sessionId

    const loginUrl = event.loginUrl
    const formData = {
      username,
      password
    }
    const res = await post({
      url: loginUrl,
      form: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    const newSessionId = res.cookies['session_id']
    await redis.set('cinci-register', 'sessionId', newSessionId, 60*60)
    return newSessionId
  }

  async deactivateTicket(eventId, barcode) {
    const event = await Event.getEventById(eventId)
    if (!event) return false
    const { domain } = event
    const username = event.username
    const password = event.password
    let sessionId = await this.login(username, password, event)
    let ticketInfo = await this.getTicketInfo(barcode, event)
    if (!ticketInfo || ticketInfo['Status'] !== 'active') return false

    // all properties are required
    await post({
      url: `${domain}/merchant/products/2/manage/tickets`,
      form: {
        name: ticketInfo['Ticket Holder'] || 'Terrapin Ticketing',
        status: 'void',
        scanned: ticketInfo['Scanned'],
        cmd: 'edit',
        id: ticketInfo.lookupId
      },
      cookieValue: { session_id: sessionId }
    })

    return true
  }

  async reactivateTicket(eventId, barcode) {
    const event = await Event.getEventById(eventId)
    if (!event) return false
    const { domain } = event
    const username = event.username
    const password = event.password
    let sessionId = await this.login(username, password, event)
    let ticketInfo = await this.getTicketInfo(barcode, event)
    if (!ticketInfo || ticketInfo['Status'] !== 'void') return false

    // all properties are required
    await post({
      url: `${domain}/merchant/products/2/manage/tickets`,
      form: {
        name: ticketInfo['Ticket Holder'] || 'Terrapin Ticketing',
        status: 'active',
        scanned: ticketInfo['Scanned'],
        cmd: 'edit',
        id: ticketInfo.lookupId
      },
      cookieValue: { session_id: sessionId }
    })

    return true
  }

  async issueTicket(event, user, ticketType) {
    const username = event.username
    const password = event.password

    let sessionId = await this.login(username, password, event)
    let ticketIssueRoute = event.issueTicketRoute
    let ticketPortal = url.resolve(event.domain, ticketIssueRoute)
    let sVal = await getSValue(ticketPortal)

    let issueTicketRequestBody = {
      s: sVal,
      step: 0,
      r: 0,
      first_name: user.firstName || 'Terrapin',
      last_name: user.lastName || 'Ticketing',
      _billing_first_name: user.firstName || 'Terrapin',
      _billing_last_name: user.lastName || 'Ticketing',
      address: 'test',
      city: 'tet',
      state: 'OH',
      zip_code: 45209,
      _billing_zip_code: 45209,
      'phone_number': [ 900, 623, 6235 ],
      _billing_method: event.auth.billingMethod,
      _hide_coupon: 0,
      [event.auth.billingNum]: 0,
      _billing_country: 'US',
      _billing_state: 'OH',
      email_address: 'brewgrass@terrapinticketing.com',
      _email_address: 'brewgrass@terrapinticketing.com',
      'cmd=forward': 'SUBMIT ORDER',
      [event.auth.rVal]: 1
    }

    // add ticket level to request body
    let reqParam = event.ticketTypes[ticketType].paramName
    issueTicketRequestBody[reqParam] = 1

    // add promocode to request body
    issueTicketRequestBody['coupon_code'] = event.promoCode

    // SUBMIT this sVal ORDER
    await post({
      url: ticketPortal,
      form: issueTicketRequestBody,
      cookieValue: { session_id: sessionId }
    })

    // USER sVal ORDER to print ticket
    let printTicketRes = await post({
      url: ticketPortal,
      form: {
        s: sVal,
        step: 1,
        r: 0,
        'cmd=tprint': 'Print Tickets'
      },
      cookieValue: { session_id: sessionId }
    })
    let printableTicket = printTicketRes.body
    // console.log('printableTicket', printableTicket);
    let ticketNum
    try {
      ticketNum = printableTicket.match(/[0-9]{16}/)[0]
    } catch (e) {
      console.log('failed to create ticket', ticketType, new Date())
      return false
    }

    // success if ticket became invalid
    return ticketNum
  }

  async isValidTicket(ticketId, event) {
    let tickets = await this._getTickets(event)
    let ticket = tickets[ticketId]
    if (!ticket) return false


    let scanned = tickets[ticketId]['Scanned']
    let isScanned = scanned !== '0'

    const types = await this.getTicketTypes(event._id)
    const ticketType = ticket['Ticket Level']

    if (ticket.Status === 'active' && !isScanned) {
      return ticket
    }

    if (!types[ticketType]) {
      console.log('unsupported ticket type:', ticketType)
      return false
    }

    return false
  }

  // expensive
  async _getTickets(event) {
    const username = event.username
    const password = event.password
    let sessionId = await this.login(username, password, event)
    let csvExport = (await post({
      url: `${event.domain}/merchant/products/2/manage/tickets`,
      form: {
        form_id: event.externalEventId,
        from: 'January 1, 2000 2:35 PM',
        to: 'January 1, 2030 2:35 PM',
        fields: requestFields,
        filename: 'export.csv',
        cmd: 'export'
      },
      cookieValue: { session_id: sessionId }
    })).body

    let ticketLookupTable = {}
    await new Promise((resolve) => {
      csv().fromString(csvExport)
        .on('csv', async(row) => {
          let ticketNum = row[2].substring(1, row[2].length)
          let ticketEntry = ticketLookupTable[ticketNum] = {
            lookupId: ticketNum.substring(9, ticketNum.length)
          }
          for (let i = 0; i < row.length; i++) {
            ticketEntry[fields[i]] = row[i]
            // set the ticket price based on the ticket level (ticket type)
            if (fields[i] === 'Ticket Level') {
              let ticketLevel = ticketEntry[fields[i]]
              // if we don't support this ticket type, don't look it up
              if (!event.ticketTypes[ticketLevel]) continue
              ticketEntry.price = event.ticketTypes[ticketLevel].price
              ticketEntry.type = ticketLevel
            }
          }
        })
        .on('done', resolve)
    })
    return ticketLookupTable
  }

  async getTicketInfo(ticketId, event) {
    let tickets = await this._getTickets(event)

    return tickets[ticketId]
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

  async transferTicket(ticket, toUser) {
    if (!toUser || !ticket) return false
    const { eventId, barcode } = ticket
    const success = await this.deactivateTicket(eventId, barcode)
    if (!success) return false
    const event = await Event.getEventById(eventId)
    if (!event) return false
    const newBarcode = await this.issueTicket(event, toUser, ticket.type)
    if (!newBarcode) { // if issue didn't work, reactiate old ticket
      console.log('reactivating', barcode)
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
export default new CinciRegisterIntegration()

async function getSValue(ticketPortal) {
  let ticketPage = (await get(ticketPortal)).body
  let lineMatch = ticketPage.match(/.*\bname[ \t]*="s".*\b/)[0]
  let sVal = lineMatch.match(/value=(["'])(?:(?=(\\?))\2.)*?\1/)[0].substring(7, 39)
  return sVal
}

const fields = [
  'Ticket Holder',
  'Ticket Level',
  'Ticket Number',
  'Status',
  'Scanned',
  'Creation Date',
  'Billing First Name',
  'Billing Last Name',
  'Billing Address',
  'Billing City',
  'Billing Country',
  'Billing State',
  'Billing Zip Code',
  'Billing Phone',
  'Billing Date',
  'Card/Account',
  'Order Number',
  'Email Address',
  'IP Address',
  'Campaign',
  'Registration ID',
  'Transaction ID',
  'Gateway Name',
  'Gateway Label'
]
const requestFields = 'tick.name,layout.name,tick.id,tick.status,tick.scanned,tick.created,trx.first_name,trx.last_name,trx.address,trx.city,trx.country,trx.state,trx.zip_code,trx.phone,trx.payment_date,trx.account,trx.order_number,reg.email,trx.ip_address,form.name,reg.id,trx.id,gateway.label,gateway.name'
