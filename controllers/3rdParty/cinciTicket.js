import uuidv1 from 'uuid/v4';
import request from 'request';
import url from 'url';
import csv from 'csvtojson';

let cincyTicketUsername = process.env.CINCI_UN;
if (!process.env.CINCI_UN) throw new Error('process.env.CINCI_UN is not set (password)');
let cincyTicketPassword = process.env.CINCI_PW;
if (!process.env.CINCI_PW) throw new Error('process.env.CINCI_PW is not set (username)');

let domain = 'https://terrapin.cincyregister.com';

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

    let res = await reqPOST('/merchant/products/2/manage/tickets', {
      name: '1first 1last',
      status: 'void',
      scanned: 0,
      cmd: 'edit',
      id: ticketInfo.lookupId,
      query: `registrations?cmd=view&id=${ticketInfo.regId}`
    }, sessionId);

    console.log(res);
    return true;
  }

  async isValidTicket(barcode) {
    let tickets = await this._getTickets();
    return tickets[barcode].status === 'active';
  }

  async _getTickets() {
    let sessionId = await this._login();
    let csvExport = (await reqPOST('/merchant/products/2/manage/tickets', {
      from: 'January 3, 2018 2:35 PM',
      to: 'January 4, 2018 2:35 PM',
      fields: 'tick.name,tick.id,tick.status,reg.id',
      filename: 'export.csv',
      cmd: 'export'
    }, sessionId)).body;

    let ticketLookupTable = {};
    await new Promise((resolve) => {
      csv().fromString(csvExport)
        .on('csv', (row) => {
          let ticketNum = row[1].substring(1, row[1].length);
          ticketLookupTable[ticketNum] = {
            name: row[0],
            id: ticketNum,
            lookupId: row[1].substring(10, row[1].length),
            status: row[2],
            regId: row[3]
          };
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
