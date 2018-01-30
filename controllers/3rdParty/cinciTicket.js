import request from 'request';
import url from 'url';
import csv from 'csvtojson';

let cincyTicketUsername = process.env.CINCI_UN;
if (!process.env.CINCI_UN) throw new Error('process.env.CINCI_UN is not set (password)');
let cincyTicketPassword = process.env.CINCI_PW;
if (!process.env.CINCI_PW) throw new Error('process.env.CINCI_PW is not set (username)');

// let ticketPortal = 'https://terrapin.cincyregister.com/testfest';
// let ticketPortal = 'https://terrapin.cincyregister.com/testfest';
let domain = 'https://terrapin.cincyregister.com';

let fields = [
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
];

let requestFields = 'tick.name,layout.name,tick.id,tick.status,tick.scanned,tick.created,trx.first_name,trx.last_name,trx.address,trx.city,trx.country,trx.state,trx.zip_code,trx.phone,trx.payment_date,trx.account,trx.order_number,reg.email,trx.ip_address,form.name,reg.id,trx.id,gateway.label,gateway.name';

async function reqPOST(route, formData, cookieValue) {
  let jar = request.jar();
  let cookie = request.cookie(`session_id=${cookieValue}`);
  jar.setCookie(cookie, domain);
  let fullUrl = url.resolve(domain, route);
  let options = {
    method: 'POST',
    url: fullUrl,
    formData,
    jar,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  };
  return await new Promise((resolve, reject) => { // eslint-disable-line
    request(options, (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
  });
}

async function reqGET(route) {
  return await new Promise((resolve, reject) => {
    return request(route, (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
  });
}

async function getSValue(ticketPortal) {
  let ticketPage = (await reqGET(ticketPortal)).body;
  let lineMatch = ticketPage.match(/.*\bname[ \t]*="s".*\b/)[0];
  let sVal = lineMatch.match(/value=(["'])(?:(?=(\\?))\2.)*?\1/)[0].substring(7, 39);
  return sVal;
}

class CincyTicket {
  async deactivateTicket(barcode, event) {
    let sessionId = await this._login();
    let ticketInfo = await this.getTicketInfo(barcode, event);
    if (!ticketInfo || ticketInfo['Status'] !== 'active') return false;

    // all properties are required
    await reqPOST('/merchant/products/2/manage/tickets', {
      name: ticketInfo['Ticket Holder'],
      status: 'void',
      scanned: ticketInfo['Scanned'],
      cmd: 'edit',
      id: ticketInfo.lookupId
    }, sessionId);

    let isValidTicket = await this.isValidTicket(
      ticketInfo['Ticket Number'].substring(1, ticketInfo['Ticket Number'].length), event);
    // success if ticket became invalid
    let success = !isValidTicket;
    return success;
  }

  async issueTicket(event, oldTicket, user) {
    let sessionId = await this._login();
    let ticketIssueRoute = event.issueTicketRoute;
    let ticketPortal = `${event.domain}${ticketIssueRoute}`;
    let sVal = await getSValue(ticketPortal);

    let issueTicketRequestBody = {
      s: sVal,
      step: 0,
      r: 0,
      first_name: user.firstName || 'Terrapin',
      last_name: user.lastName || 'Ticketing',
      address: 'test',
      city: 'tet',
      state: 'OH',
      zip_code: 45209,
      email_address: 'reeder@terrapinticketing.com',
      _email_address: 'reeder@terrapinticketing.com',
      'cmd=forward': 'SUBMIT ORDER'
    };

    // add ticket level to request body
    let ticketType = oldTicket['Ticket Level'];
    let reqParam = event.ticketTypes[ticketType].paramName;
    issueTicketRequestBody[reqParam] = 1;

    // add promocode to request body
    issueTicketRequestBody['coupon_code'] = event.promoCode;

    // SUBMIT this sVal ORDER
    await reqPOST(ticketIssueRoute, issueTicketRequestBody, sessionId);

    // USER sVal ORDER to print ticket
    let printableTicket = (await reqPOST(ticketIssueRoute, {
      s: sVal,
      step: 1,
      r: 0,
      'cmd=tprint': 'Print Tickets'
    }, sessionId)).body;
    let ticketNum = printableTicket.match(/[0-9]{16}/)[0];

    // success if ticket became invalid
    return ticketNum;
  }

  async isValidTicket(ticketId, event) {
    let tickets = await this._getTickets(event);
    let ticket = tickets[ticketId];
    if (!ticket) return false;

    let scanned = tickets[ticketId]['Scanned'];
    let isScanned = scanned !== '0';

    return ticket.Status === 'active' && !isScanned;
  }

  async _getOrderDetails(orderNumber) {
    // let sessionId = await this._login();

    // let res = await reqPOST('/merchant/products/2/manage/transactions', {
    //   from: 'January 3, 2018 2:35 PM',
    //   to: 'January 4, 2018 2:35 PM',
    //   fields: requestFields,
    //   filename: 'export.csv',
    //   cmd: 'export'
    // }, sessionId);
    return 1000;
  }

  // expensive
  async _getTickets(event) {
    let sessionId = await this._login();
    let csvExport = (await reqPOST('/merchant/products/2/manage/tickets', {
      form_id: event.externalEventId,
      from: 'January 1, 2018 2:35 PM',
      to: 'January 1, 2019 2:35 PM',
      fields: requestFields,
      filename: 'export.csv',
      cmd: 'export'
    }, sessionId)).body;

    let ticketLookupTable = {};
    await new Promise((resolve) => {
      csv().fromString(csvExport)
        .on('csv', async(row) => {
          let ticketNum = row[2].substring(1, row[2].length);
          let ticketEntry = ticketLookupTable[ticketNum] = {
            lookupId: ticketNum.substring(9, ticketNum.length)
          };
          for (let i = 0; i < row.length; i++) {
            ticketEntry[fields[i]] = row[i];
            // set the ticket price based on the ticket level (ticket type)
            if (fields[i] === 'Ticket Level') {
              let ticketLevel = ticketEntry[fields[i]];
              ticketEntry.price = event.ticketTypes[ticketLevel].price;
              ticketEntry.type = ticketLevel;
            }
          }
        })
        .on('done', resolve);
    });
    return ticketLookupTable;
  }

  async getTicketInfo(ticketId, event) {
    let tickets = await this._getTickets(event);
    return tickets[ticketId];
  }

  async _login() {
    let fullUrl = 'https://cp.cincyregister.com/';
    let options = {
      method: 'POST',
      url: fullUrl,
      formData: {
        username: cincyTicketUsername,
        password: cincyTicketPassword
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };
    return await new Promise((resolve, reject) => { // eslint-disable-line
      request(options, (err, res) => {
        if (err) return reject(err);
        let cookies = res.headers['set-cookie'][0].split(';');
        let sessionCookie = cookies[0];
        let sessionId = sessionCookie.split('=')[1];
        resolve(sessionId);
      });
    });
  }
}

export default CincyTicket;
