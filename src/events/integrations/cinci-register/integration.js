import url from 'url'
import Event from '../../../events/controller'
import Ticket from '../../../tickets/controller'

import IntegrationInterface from '../IntegrationInterface'
import { post, get } from '../../../_utils/http'
import redis from '../../../_utils/redis'

import csv from 'csvtojson'

class CinciRegisterIntegration extends IntegrationInterface {
  async login(username, password) {
    const sessionId = await redis.get('cinci-register', 'sessionId')
    if (sessionId) return sessionId

    const loginUrl = process.env.CINCI_REGISTER_TEST_LOGIN_URL
    const formData = {
      username,
      password
    }
    const res = await post(loginUrl, formData)
    const newSessionId = res.cookies['session_id']
    await redis.set('cinci-register', 'sessionId', newSessionId, 60*60)
    return newSessionId
  }

  async deactivateTicket(eventId, barcode) {
    const event = await Event.getEventById(eventId)
    if (!event) return false
    const { username, password, domain } = event
    let sessionId = await this.login(username, password)
    let ticketInfo = await this.getTicketInfo(barcode, event)
    if (!ticketInfo || ticketInfo['Status'] !== 'active') return false

    // all properties are required
    await post(`${domain}/merchant/products/2/manage/tickets`, {
      name: ticketInfo['Ticket Holder'] || 'Terrapin Ticketing',
      status: 'void',
      scanned: ticketInfo['Scanned'],
      cmd: 'edit',
      id: ticketInfo.lookupId
    }, { session_id: sessionId})

    let isValidTicket = await this.isValidTicket(
      ticketInfo['Ticket Number'].substring(1, ticketInfo['Ticket Number'].length), event)

    // success if ticket became invalid
    let success = !isValidTicket
    return success
  }

  async issueTicket(event, user, ticketType) {
    let sessionId = await this.login(event.username, event.password)
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
      _billing_method: 10292,
      _hide_coupon: 0,
      _billing_3653461: 0,
      _billing_country: 'US',
      _billing_state: 'OH',
      email_address: 'brewgrass@terrapinticketing.com',
      _email_address: 'brewgrass@terrapinticketing.com',
      'cmd=forward': 'SUBMIT ORDER',
      r3653466: 1
    }

    // add ticket level to request body
    let reqParam = event.ticketTypes[ticketType].paramName
    issueTicketRequestBody[reqParam] = 1

    // add promocode to request body
    issueTicketRequestBody['coupon_code'] = event.promoCode

    // SUBMIT this sVal ORDER
    await post(ticketPortal, issueTicketRequestBody, { session_id: sessionId })

    // USER sVal ORDER to print ticket
    let printTicketRes = await post(ticketPortal, {
      s: sVal,
      step: 1,
      r: 0,
      'cmd=tprint': 'Print Tickets'
    }, { session_id: sessionId })
    // console.log('printTicketRes', printTicketRes);
    let printableTicket = printTicketRes.body
    // console.log('printableTicket', printableTicket);
    let ticketNum = printableTicket.match(/[0-9]{16}/)[0]

    // success if ticket became invalid
    return ticketNum
  }

  async isValidTicket(ticketId, event) {
    let tickets = await this._getTickets(event)
    let ticket = tickets[ticketId]
    if (!ticket) return false

    let scanned = tickets[ticketId]['Scanned']
    let isScanned = scanned !== '0'

    return ticket.Status === 'active' && !isScanned
  }

  // expensive
  async _getTickets(event) {
    let sessionId = await this.login(event.username, event.password)
    let csvExport = (await post(`${event.domain}/merchant/products/2/manage/tickets`, {
      form_id: event.externalEventId,
      from: 'January 1, 2000 2:35 PM',
      to: 'January 1, 2030 2:35 PM',
      fields: requestFields,
      filename: 'export.csv',
      cmd: 'export'
    }, { session_id: sessionId })).body

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
    const event = await Event.getEventById(eventId)
    return event && event.ticketTypes
  }

  async getEventInfo(eventId) {
    const event = await Event.getEventById(eventId)
    return event
  }

  async transferTicket(ticket, toUser) {
    const { eventId, barcode } = ticket
    const success = await this.deactivateTicket(eventId, barcode)
    if (!success) return false

    const event = await Event.getEventById(eventId)
    const newBarcode = await this.issueTicket(event, toUser, ticket.type)
    if (!newBarcode) return false

    const newTicket = await Ticket.set(ticket._id, {
      ownerId: toUser._id,
      newBarcode
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
