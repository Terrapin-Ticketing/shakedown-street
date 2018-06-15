import IntegrationInterface from '../IntegrationInterface'
import { post, get } from '../../_utils/http'
import queryString from 'query-string'
// import redis from '../../_utils/redis'

class CinciTicketIntegration extends IntegrationInterface {
  async login(username, password) {
    // const serializedSessionCookies = await redis.get('cinci-ticket', 'sessionCookies')
    // const sessionCookies = JSON.parse(serializedSessionCookies)
    // if (sessionCookies) return sessionCookies

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
    // await redis.set('cinci-ticket', 'sessionCookies', JSON.stringify(res.cookies), 60*60)
    // return res.cookies
    return queryString.stringify(res.cookies)
  }

  async isValidTicket(barcode, event) {
    const { username, password } = event
    const authCookies = await this.login(username, password)

    console.log(authCookies)

    const res = await get('https://cincyticket.showare.com/admin/CallCenter.asp?TitelHaupt=Call%20Center&Titel=New%20Call%20Center%20Order', {
      // cookieValue: {
      //   ShowareVersion: '20228b0332',
      //   ...authCookies
      // },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': authCookies
      }

      // headers: {
      //   ...authCookies
      // }
    })

    console.log(res)

    // const res = await post({
    //   url: 'https://cincyticket.showare.com/admin/OrderList.asp',
    //   form: {
    //     BarCode: '0000001860012019400002',
    //     sessionKey: '85100593FF2CC6F3DDF9C73B2E53AD9ACD3A48F916A9066DA550076266F35B0FE4C7DC567DE3EC0E3B1495329FE2901E8302C5FFB84AE3E7E42489FC4CAC6E9F08259F2163FD3A2A'
    //   },
    //   // headers: {
    //   //   ...authCookies
    //   // }
    //   cookies: authCookies 
    // })
    // console.log(res)
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
