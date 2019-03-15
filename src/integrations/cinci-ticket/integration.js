import cheerio from 'cheerio'
import IntegrationInterface from '../IntegrationInterface'
import { post, get } from '../../_utils/http'
import _get from 'lodash.get'
import Ticket from '../../tickets/controller'
import Event from '../../events/controller'

class CinciTicketIntegration extends IntegrationInterface {
  async login(username, password, event) {
    const loginUrl = event.loginUrl
    const formData = {
      frm_login: username,
      frm_password: password,
      activity: 'Login'
    }
    const res = await post({
      url: loginUrl,
      form: formData,
      timeout: 30000
    })
    return `${res.rawCookies}BOLP=${event.externalEventId};`
  }

  async getSessionKey(authCookies) {
    const sessionKeyRes = await get('https://cincyticket.showare.com/admin/getSessionKey.asp', {
      headers: {
        'Cookie': authCookies
      }
    })
    const { sessionKey } = JSON.parse(sessionKeyRes.body)
    return sessionKey
  }

  async isValidTicket(barcode, event) {
    if (!barcode || barcode.length !== 22) return false
    const { username, password } = event
    const rawCookies = await this.login(username, password, event)

    const sessionKey = await this.getSessionKey(rawCookies)

    const lookupPost = await post({
      url: 'https://cincyticket.showare.com/admin/OrderList.asp',
      headers: {
        'Cookie': rawCookies
      },
      form: {
        BarCode: barcode,
        sessionKey,
        SearchButtonPressed: true,
        activity: 'search',
        isDownload: 0,
        sortdir: 'ASC',
        sortfield: 'o.OrderID',
        bopm: -1,
        ShippingMethod: 0,
        PatronOptIn: -1,
        accesscontrol: 0,
        pricingcodegroup: -1,
        SalesPerson: 0,
        resaleitemstatusID: 0,
        lineitemstatus: 0,
        orderstatus: 0,
        itemtype: 0,
        sPromoter: 0
      }
    })

    const lookupGetSearchResult = await get(`https://cincyticket.showare.com/admin/${lookupPost.headers.location}`, {
      headers: {
        'Cookie': rawCookies
      }
    })

    const hasBarcode = lookupGetSearchResult.body.includes(barcode)
    const isCanceled = lookupGetSearchResult.body.includes('canceled not refunded')

    return hasBarcode && !isCanceled
  }

  async issueTicket(event, user, ticketType) {
    const externalEventId = event.externalEventId

    const { username, password } = event
    const rawCookies = await this.login(username, password, event)

    const sessionKey = await this.getSessionKey(rawCookies)
    const areaId = event.auth.areaId
    const paymentType = event.auth.paymentType

    // 1. add to cart
    const form = {
      numPC: 3,
      area: areaId,
      qty: 1,
      areatype: 1,
      ID: externalEventId,
      GAMultiPC_1: areaId,
      sessionKey
    }
    form[`qty_${areaId}_1`] = 1
    form[`pc_${areaId}_1`] = ticketType
    form[`numpc_${areaId}`] = 3
    const addToBasketRes = await post({
      url: 'https://cincyticket.showare.com/admin/CallCenter_AddSeatsToBasket.asp',
      headers: {
        Cookie: rawCookies
      },
      form
    })

    let rawCookiesWithBasketId = `${rawCookies}${addToBasketRes.headers['set-cookie'][0]}`
    const csb = await get('https://cincyticket.showare.com/admin/CallCenter_Basket.asp?enlargebasket=x', {
      headers: {
        Cookie: rawCookiesWithBasketId
      }
    })

    if (csb.body.includes('Basket (0 items in basket)')) {
      console.error('Basket Empty - Cinci Ticket')
      return false
    }

    const zip = 45044
    const ticketTypeId = 20943

    const config = {
      url: `https://cincyticket.showare.com/admin/CallCenter_InstantBoxOfficeCheckout.asp?payment=${paymentType}&amountgiven=&zipcode=${zip}&heardabout=`,
      headers: {
        Cookie: rawCookiesWithBasketId
      },
      form: {
        del_ItemType_0: 'Ticket',
        del_AreaType_0: 1,
        del_performance_0: externalEventId,
        del_area_0: areaId, // no idea what this is
        del_coordy_0: 0,
        del_coordx_0: 0,
        del_GATicketID_0: ticketTypeId,
        activity: 'update',
        NumTickets: 1,
        iUpdateCounter: 0,
        sessionKey,
        firstname: _get(user, 'firstName', 'TerrapinFirst'),
        lastname: _get(user, 'lastName', 'TerrapinLast'),
        email: _get(user, 'email', 'info@terrapinticketing.com'),
        zipcode: zip,
        newCCCheckoutOptDefault: 0
      }
    }
    config.form[`pricingCodeGroup-${ticketTypeId}`] = 0,
    config.form[`pricingCode-${ticketTypeId}: 0`] = 0

    const buyTicketRes = await post(config)

    let orderNumPage = cheerio.load(buyTicketRes.body)

    let orderNumber = orderNumPage('#iOrderNo').attr('value')
    if (!orderNumber) return false

    const orderDetails = await get(`https://cincyticket.showare.com/admin/OrderDetail.asp?ID=${orderNumber}`, {
      headers: {
        Cookie: rawCookiesWithBasketId
      }
    })

    const match = orderDetails.body.match(/\d{22}/)
    if (!match) return false

    const barcode = match[0]
    return barcode
  }

  async getTicketInfo(barcode, event) {
    const { username, password } = event
    const rawCookies = await this.login(username, password, event)

    const sessionKey = await this.getSessionKey(rawCookies)

    const lookupPost = await post({
      url: 'https://cincyticket.showare.com/admin/OrderList.asp',
      headers: {
        'Cookie': rawCookies
      },
      form: {
        BarCode: barcode,
        sessionKey,
        SearchButtonPressed: true,
        activity: 'search',
        isDownload: 0,
        sortdir: 'ASC',
        sortfield: 'o.OrderID',
        bopm: -1,
        ShippingMethod: 0,
        PatronOptIn: -1,
        accesscontrol: 0,
        pricingcodegroup: -1,
        SalesPerson: 0,
        resaleitemstatusID: 0,
        lineitemstatus: 0,
        orderstatus: 0,
        itemtype: 0,
        sPromoter: 0
      }
    })

    const lookupGetSearchResult = await get(`https://cincyticket.showare.com/admin/${lookupPost.headers.location}`, {
      headers: {
        'Cookie': rawCookies
      }
    })

    const orderDetails = cheerio.load(lookupGetSearchResult.body)
    const orderNumber = orderDetails('#iOrderNo').attr('value')
    const ticketId = orderDetails('input[name="ItemID_1"]').attr('value')
    const ticketTypeEl = orderDetails('#TicketsTable tbody tr:nth-child(3) td:nth-child(4)').clone().html()
    const ticketType = ticketTypeEl.match(/\(([^\)]+)\)/)[1] // eslint-disable-line

    const chooseTicketRes = await get(`https://cincyticket.showare.com/admin/CallCenter_PerformanceDetail.asp?ID=${event.externalEventId}`, {
      headers: {
        Cookie: rawCookies
      }
    })

    const index = chooseTicketRes.body.indexOf(`(${ticketType})`)
    const pricingSegment = chooseTicketRes.body.substring(index, index+30)
    const price = Number(pricingSegment.replace(/[^0-9]+/g, ''))

    return {
      price,
      type: ticketType,
      orderNumber,
      ticketId
    }
  }

  async deactivateTicket(eventId, barcode) {
    const event = await Event.findOne({ _id: eventId })
    const { orderNumber, ticketId } = await this.getTicketInfo(barcode, event)

    const { username, password } = event
    const rawCookies = await this.login(username, password, event)

    const sessionKey = await this.getSessionKey(rawCookies)

    const cancelTicketRes = await post({
      url: `https://cincyticket.showare.com/admin/OrderDetail.asp?ID=${orderNumber}&TitelHaupt=Order%20Management&Titel=Order%20Detail`,
      headers: {
        Cookie: rawCookies
      },
      form: {
        UserID: 0,
        DisplayOptions: 1,
        curPrinted_1: 0,
        ItemID_1: ticketId,
        CsvTickets: ticketId,
        numTicketsPrinted: 0,
        numItems: 1,
        iOrderNo: orderNumber,
        activity: 'canceltickets',
        ID: orderNumber,
        Titel: 'Order Detail',
        TitelHaupt: 'Order Management',
        resendemail: 'P',
        sPatronEmail: 'test@test.com',
        sBillingEmail: 'test@test.com',
        sessionKey
      }
    })
    const wasSuccess = cancelTicketRes.headers.location.includes('InfoMessage=Selected+Items+were+canceled+successfully')
    return wasSuccess
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
      barcode: newBarcode,
      isForSale: false
    })

    return newTicket
  }
}

export default new CinciTicketIntegration()
