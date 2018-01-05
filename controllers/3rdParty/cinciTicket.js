import uuidv1 from 'uuid/v4';
import request from 'request';
import url from 'url';
import csv from 'csvtojson';

let cincyTicketUsername = process.env.CINCI_UN;
if (!process.env.CINCI_UN) throw new Error('process.env.CINCI_UN is not set (password)');
let cincyTicketPassword = process.env.CINCI_PW;
if (!process.env.CINCI_PW) throw new Error('process.env.CINCI_PW is not set (username)');

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


class CincyTicket {
  async deactivateTicket(barcode) {
    let sessionId = await this._login();
    let ticketInfo = await this.getTicketInfo(barcode);
    if (!ticketInfo) return false;

    // all properties are required
    await reqPOST('/merchant/products/2/manage/tickets', {
      name: ticketInfo['Ticket Holder'],
      status: 'void',
      scanned: ticketInfo['Scanned'],
      cmd: 'edit',
      id: ticketInfo.lookupId
    }, sessionId);

    let isValidTicket = await this.isValidTicket(
      ticketInfo['Ticket Number'].substring(1, ticketInfo['Ticket Number'].length));
    // success if ticket became invalid
    let success = !isValidTicket;
    return success;
  }

  async issueTicket(barcode) {
    let sessionId = await this._login();
    let ticketInfo = await this.getTicketInfo(barcode);
    if (!ticketInfo) return false;

    // all properties are required
    await reqPOST('/merchant/products/2/manage/tickets', {
      name: ticketInfo['Ticket Holder'],
      status: 'active',
      scanned: ticketInfo['Scanned'],
      cmd: 'edit',
      id: ticketInfo.lookupId
    }, sessionId);

    return uuidv1();
  }

  async isValidTicket(ticketId) {
    let tickets = await this._getTickets();
    return tickets[ticketId] && tickets[ticketId].Status === 'active';
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
    return false;
  }

  async _getTickets() {
    let sessionId = await this._login();
    let csvExport = (await reqPOST('/merchant/products/2/manage/tickets', {
      from: 'January 3, 2018 2:35 PM',
      to: 'January 4, 2018 2:35 PM',
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
            if (fields[i] === 'Order Number') {
              ticketEntry['Order Details'] = await this._getOrderDetails(fields[i]);
            }
          }
        })
        .on('done', resolve);
    });

    return ticketLookupTable;
  }

  async getTicketInfo(ticketId) {
    let tickets = await this._getTickets();
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
