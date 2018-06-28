import IntegrationInterface from '../IntegrationInterface'
import { post, get } from '../../_utils/http'

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
      form: formData
    })
    return res.rawCookies
  }

  async isValidTicket(barcode, event) {
    const { username, password } = event
    const rawCookies = await this.login(username, password)

    const sessionKeyRes = await get('https://cincyticket.showare.com/admin/getSessionKey.asp', {
      headers: {
        'Cookie': rawCookies
      }
    })

    const { sessionKey } = JSON.parse(sessionKeyRes.body)

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
        dateto: '6/27/2018',
        datefrom: '6/27/2017',
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

  // async deactivateTicket() {
  //
  // }
  //
  // async issueTicket() {
  //   // buy a ticket with cash
  //   // look up by order number: https://cincyticket.showare.com/admin/OrderDetail.asp?ID=100156
  //
  // }
  // async isValidTicket(barcode) {
  /*
    look up by barcode
    POST: https://cincyticket.showare.com/admin/OrderList.asp
  */
  // }
}


export default new CinciTicketIntegration()



/*
OrderNo:
sEvent:
AutosEvent:
sEventCat:
AutosEventCat:
sPromoter: 0
AutosPromoter:
PerformanceInput:
performancedatefrom:
performancedateto:
itemtype: 0
ReservationID:
SeatLocation:
SeatPrefix:
SeatNo:
AccessCode:
orderstatus: 0
lineitemstatus: 0
resaleitemstatusID: 0
datefrom: 6/14/2017
dateto: 6/14/2018
heardabout:
SalesPerson: 0
saleschannel:
PricingCode:
pricingcodegroup: -1
Autopricingcodegroup:
BarCode: 0000001860012019400002
accesscontrol: 0
UserID:
BillingCompany:
Useremail:
BillingFirstName:
BillingLastName:
BillingPhone:
BillingCountry:
BillingState:
BillingCity:
BillingZipCode:
PatronOptIn: -1
delmethod: 0
ShippingMethod: 0
sUserCreated:
soldfor:
canceldatefrom:
canceldateto:
refdatefrom:
refdateto:
printdatefrom:
printdateto:
maildatefrom:
maildateto:
TransactionAmount:
CCLast4Digits:
sCCTransID:
sPaymentMethod:
bopm: -1
PaymentComment:
sortfield: o.OrderID
sortdir: ASC
ReportDownload:
isDownload: 0
activity: search
Titel:
Gruppe:
TitelHaupt:
SearchButtonPressed: true
sessionKey:
85100593FF2CC6F3DDF9C73B2E53AD9ACD3A48F916A9066DA550076266F35B0FE4C7DC567DE3EC0E3B1495329FE2901E8302C5FFB84AE3E7E42489FC4CAC6E9F08259F2163FD3A2A



2AF8CD2B436CBBBD4C191874B336321DB9C4E4452FA129DAA550076266F35B0FE2A5ECB9AFBAF0DCF622BFD5F6B5789CC6805DB00235F876
*/
