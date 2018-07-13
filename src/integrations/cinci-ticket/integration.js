import cheerio from 'cheerio'
import IntegrationInterface from '../IntegrationInterface'
import { post, get } from '../../_utils/http'
import _get from 'lodash.get'

class CinciTicketIntegration extends IntegrationInterface {
  async login(username, password) {
    const loginUrl = process.env.CINCI_TICKET_LOGIN_URL
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
    return res.rawCookies
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
    const { username, password } = event
    const rawCookies = await this.login(username, password)

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

    return lookupGetSearchResult.body.includes(barcode)
  }

  async issueTicket(event, user, ticketType = 'REG') {
    const externalEventId = event.externalEventId

    const { username, password } = event
    const rawCookies = await this.login(username, password)

    const sessionKey = await this.getSessionKey(rawCookies)
    const areaId = event.auth.areaId

    const form = {
      qpprice: 0,
      qpqty: 2,
      PricingCodeGroupID: 0,
      numPC: 1,
      area: areaId, // ????
      qty: 1,
      areatype: 1,
      ID: externalEventId,
      // qty_246_1: 1,
      // pc_246_1: ticketType, // TICKET TYPE
      // numpc_246: 1,
      // GAMultiPCCount:
      sessionKey
    }

    form[`qty_${areaId}_1`] = 1
    form[`pc_${areaId}_1`] = ticketType
    form[`numpc_${areaId}`] = 1

    // 1. add to cart
    const addToBasketRes = await post({
      url: 'https://cincyticket.showare.com/admin/CallCenter_AddSeatsToBasket.asp',
      headers: {
        Cookie: rawCookies
      },
      form
    })

    let rawCookiesWithBasketId = `${rawCookies} ${addToBasketRes.rawCookies}`

    const zip = 45044
    const ticketTypeId = 20943

    const config = {
      url: `https://cincyticket.showare.com/admin/CallCenter_InstantBoxOfficeCheckout.asp?payment=4&amountgiven=&zipcode=${zip}&heardabout=`,
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
        SelOrderFee: 4,
        activity: 'update',
        NumTickets: 1,
        iUpdateCounter: 0,
        sessionKey,
        bopm: 4,
        firstname: _get(user, 'firstName', 'TerrapinFirst'),
        lastname: _get(user, 'lastName', 'TerrapinLast'),
        email: _get(user, 'email', 'info@terrapinticketing.com'),
        zipcode: zip,
        // amountgiven:
        // payment_comment:
        newCCCheckoutOptDefault: 0
      }
    }

    config.form[`pricingCodeGroup-${ticketTypeId}`] = 0,
    config.form[`pricingCode-${ticketTypeId}: 0`] = 0

    const buyTicketRes = await post(config)
    let orderNumPage = cheerio.load(buyTicketRes.body)

    let orderNumber = orderNumPage('#iOrderNo').attr('value')

    const orderDetails = await get(`https://cincyticket.showare.com/admin/OrderDetail.asp?ID=${orderNumber}`, {
      headers: {
        Cookie: rawCookiesWithBasketId
      }
    })

    const barcode = orderDetails.body.match(/\d{22}/)[0]
    return barcode
  }

  // async deactivateTicket() {
  //
  // }
}

export default new CinciTicketIntegration()
