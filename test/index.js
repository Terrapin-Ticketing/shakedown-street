import config from 'config';
import assert from 'assert';
import shortid from 'shortid';
import request from 'request';
import jwt from 'jsonwebtoken';
import pasync from 'pasync';
import url from 'url';

const uuidv1 = require('uuid/v4');

let cincyTicketUsername = process.env.CINCI_UN;
if (!process.env.CINCI_UN) throw new Error('process.env.CINCI_UN is not set (password)');
let cincyTicketPassword = process.env.CINCI_PW;
if (!process.env.CINCI_PW) throw new Error('process.env.CINCI_PW is not set (username)');

let domain = 'https://terrapin.cincyregister.com';

let baseUrl = config.domain;
let NUM_USERS = 10;

async function req(route, body, cookieValue, method = 'POST', json = true) {
  if (method === 'GET') body = undefined;
  let jar = request.jar();
  let cookie = request.cookie(`cookieToken=${cookieValue}`);
  jar.setCookie(cookie, baseUrl);
  let uri = url.resolve(baseUrl, route);
  let options = {
    method,
    uri,
    body,
    json,
    jar
  };
  return await new Promise((resolve, reject) => { // eslint-disable-line
    request(options, (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
  });
}

async function reqGET(route, token = {}) {
  return (await req(route, {}, token, 'GET')).body;
}

async function printTicket(eventId, ownerId, token) {
  return await req(`events/${eventId}/tickets`, {
    ticket: {
      price: 1000,
      type: 'General Admission'
    },
    ownerId
  }, token);
}

async function getSValue(ticketPortal) {
  let ticketPage = await reqGET(ticketPortal);
  let lineMatch = ticketPage.match(/.*\bname[ \t]*="s".*\b/)[0];
  let sVal = lineMatch.match(/value=(["'])(?:(?=(\\?))\2.)*?\1/)[0].substring(7, 39);
  return sVal;
}

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

// function getTicketNum(resHTML) {
//   let pngURL = resHTML.match(/(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?.png/)[0];
//   let ticketNum = pngURL.substr(pngURL.lastIndexOf('/') + 1).replace('.png', '');
//   return ticketNum;
// }

async function issueTicket(ticketPortal, issueTicketRoute) {
  let sessionId = await login();
  let sVal = await getSValue(ticketPortal);

  let res = await reqPOST(issueTicketRoute, {
    s: sVal,
    step: 0,
    r: 0,
    vip_2day: 0,
    vip_single_day_121: 0,
    vip_single_day_122: 0,
    general_admission: 0,
    gen_121: 1,
    gen_122: 0,
    first_name: 'test',
    last_name: 'test',
    address: 'test',
    city: 'tet',
    state: 'OH',
    zip_code: 45209,
    email_address: 'kevin@terrapinticketing.com',
    _email_address: 'kevin@terrapinticketing.com',
    'cmd=forward': 'SUBMIT ORDER',
    'coupon_code': 'TERRAPIN'
  }, sessionId);

  // USER sVal ORDER to print ticket
  let printableTicket = (await reqPOST(issueTicketRoute, {
    s: sVal,
    step: 1,
    r: 0,
    'cmd=tprint': 'Print Tickets'
  }, sessionId)).body;
  // console.log(printableTicket);
  let ticketNum = printableTicket.match(/[0-9]{16}/)[0];

  return ticketNum;
}

async function login() {
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

describe('User & Auth', function() {
  // create a test users
  before(async function() {
    this.users = [];
    await pasync.eachSeries(Array(NUM_USERS), async() => {
      let login = {
        email: `${shortid.generate()}@test.com`,
        password: 'test'
      };
      let { body: { token } } = await req('signup', login);
      this.users.push({
        token,
        login,
        user: jwt.decode(token)
      });
    });
  });

  // create a test event
  before(async function() {
    let { login } = this.users[0];
    let { body: { token } } = await req('login', login);
    let uniqueId = shortid.generate();
    let domain = 'https://terrapin.cincyregister.com';
    this.freeTicketPortal = 'https://terrapin.cincyregister.com/testfest';
    this.event = {
      date: '3/4/2018',
      name: `TF Columbus Brewgrass Festival at The Bluestone (${uniqueId})`,
      urlSafe: `TFBrewgrass${uniqueId}`,
      description: 'test fest description',
      venue: {
        name: 'The Bluestone',
        address: '583 E Broad St',
        city: 'Columbus',
        state: 'OH',
        zip: 43215
      },
      imageUrl: 'http://liveatthebluestone.com/wp-content/uploads/2017/12/24068068_528690924147257_2284411860158418511_n.png',
      isThirdParty: true,
      eventManager: 'CINCI_TICKET',
      domain,
      externalEventId: 102179,
      issueTicketRoute: '/testfest'
    };
    console.log('Event urlSafe:', `TFBrewgrass${uniqueId}`);
    let { body } = await req('events', { event: this.event }, token);
    this.event._id = body._id;
  });

  // issue tickets to user
  before(async function() {
    let { token } = this.users[0];
    this.tickets = [];
    this.tickets.owner = this.users[1];
    console.log('Ticket Owner:', this.users[1].login);
    await pasync.eachSeries(Array(10), async() => {
      let res = await printTicket(this.event._id, this.users[1].user._id, token);
      let { ticket } = res.body;
      this.tickets.push(ticket);
    });
  });

  describe.only('Cinci Ticket (Test Fest)', async function() {
    // create a test event
    before(async function() {
      let { login } = this.users[0];
      let { body: { token } } = await req('login', login);
      let uniqueId = shortid.generate();
      let urlSafe = `PaidCinci${uniqueId}`;
      let domain = 'https://terrapin.cincyregister.com';
      this.issueTicketRoute = '/moofest';
      this.paidTicketPortal = domain + this.issueTicketRoute;
      this.paidEvent = {
        date: '3/4/2018',
        name: `Paid Cinci Ticket Event (${uniqueId})`,
        urlSafe,
        description: 'paid cinci ticket event',
        venue: {
          name: 'Legend Valley',
          address: '999 Fun Time',
          city: 'Theland',
          state: 'OH',
          zip: 43215
        },
        // imageUrl: 'https://images.parents.mdpcdn.com/sites/parents.com/files/styles/scale_1500_1500/public/images/wordpress/661/shutterstock_130073408-300x300.jpg',
        imageUrl: 'http://liveatthebluestone.com/wp-content/uploads/2017/12/24068068_528690924147257_2284411860158418511_n.png', //brewgrass
        isThirdParty: true,
        eventManager: 'CINCI_TICKET',
        domain,
        // externalEventId: 102179,
        externalEventId: 102384,
        issueTicketRoute: this.issueTicketRoute,
        promoCode: 'TERRAPIN',
        ticketTypes: {
          'VIP 2-Day Pass': {
            paramName: 'vip_2day',
            price: 1000
          },
          'VIP Single Day 12/1': {
            paramName: 'vip_single_day_121',
            price: 0
          },
          'VIP Single Day 12/2': {
            paramName: 'vip_single_day_122',
            price: 0
          },
          'General Admission Two-Day Pass': {
            paramName: 'general_admission',
            price: 0
          },
          'General Admission Single Day 12/1': {
            paramName: 'gen_121',
            price: 0
          },
          'General Admission Single Day 12/2': {
            paramName: 'gen_122',
            price: 0
          }
        }
      };
      console.log('PAID Event:', urlSafe);
      let { body } = await req('events', { event: this.paidEvent }, token);
      this.paidEvent._id = body._id;
    });

    // issue ticket
    before(async function() {
      this.timeout(10000);
      this.barcode = await issueTicket(this.paidTicketPortal, this.issueTicketRoute);
      this.barcode2 = await issueTicket(this.paidTicketPortal, this.issueTicketRoute);
      this.voidedBarcode = '7854772863441586';
    });

    // activate ticket
    before(async function() {
      this.timeout(10000);
      let { login } = this.users[3];
      let { urlSafe } = this.paidEvent;
      let { body } = await req(`${urlSafe}/activate`, {
        barcode: this.barcode,
        email: login.email
      });
      this.activatedTicket = body.ticket;
      if (body.error) throw new Error(body);
    });

    it('should allow user to transfer succesfully uploaded ticket', async function() {
      this.timeout(16000);
      let customer = this.users[3];
      let { body } = await req(`tickets/${this.activatedTicket._id}/transfer`, {
        email: 'kevin@terrapinticketing.com'
      }, customer.token);

      assert(body.ticket);
    });

    it('should check validity of ticket', async function() {
      let { login } = this.users[3];
      let { urlSafe } = this.paidEvent;
      let { body } = await req(`${urlSafe}/validate`, {
        barcode: this.barcode2,
        email: login.email
      });
      assert(body.isValidTicket);
    });

    it('should reject voided ticket', async function() {
      let { login } = this.users[3];
      let { urlSafe } = this.paidEvent;
      let { body } = await req(`${urlSafe}/validate`, {
        barcode: this.voidedBarcode,
        email: login.email
      });
      assert(!body.isValidTicket);
    });

    it('should reject invalid ticket id', async function() {
      this.timeout(6000);
      let { login } = this.users[3];
      let { urlSafe } = this.paidEvent;
      let { body } = await req(`${urlSafe}/activate`, {
        barcode: uuidv1(),
        email: login.email
      });
      assert(body.error === 'Invalid Ticket ID');
    });
  });

  it('should update jwt on each on each login', async function() {
    let { login, token: userToken } = this.users[0];
    let { body: { token } } = await req('login', login);
    assert(userToken !== token && userToken && token);
  });

  it('should create an event', async function() {
    let { token } = this.users[0];
    let res = await req('events', {
      event: {
        date: '3/4/2018',
        name: `hawkins snow ball ${shortid.generate()}`,
        urlSafe: `HawkinsSnowBall${shortid.generate()}`,
        description: 'testing',
        venue: {
          name: 'Test Location',
          address: '123 Fake Street',
          city: 'Fake City',
          state: 'OH',
          zip: 12345
        },
        imageUrl: 'https://terrapinticketing.com/img/phish1.png'
      }
    }, token);
    assert(res.statusCode === 200);
  });

  it('should print a ticket', async function() {
    let { user, token } = this.users[0];
    let res = await printTicket(this.event._id, user._id, token);
    let { ticket } = res.body;
    assert(ticket.ownerId === user._id);
  });

  it('should prevent unauthorized users from printing tickets', async function() {
    let { user, token } = this.users[1];
    let res = await req(`events/${this.event._id}/tickets`, {
      ticket: {
        price: 1000,
        type: 'General Admission'
      },
      ownerId: user._id
    }, token);
    assert(res.body === 'Unauthorized');
  });

  it('should get all tickets by eventId', async function() {
    let { user, token } = this.users[0];
    let numTickets = 10;
    // print 10 tickets for this event
    let ticketIds = [];
    await pasync.eachSeries(Array(numTickets), async() => {
      let res = await printTicket(this.event._id, user._id, token);
      let { ticket } = res.body;
      assert(ticket);
      ticketIds.push(ticket._id);
    });

    let { tickets } = await reqGET(`events/${this.event._id}/tickets`);
    assert(tickets.length >= ticketIds.length);
  });

  it('should get tickets by userId', async function() {
    let { token } = this.users[1];
    let { ticket } = await reqGET(`tickets/${this.tickets[0]._id}`, token);
    assert(ticket._id === this.tickets[0]._id);
  });

  it('should remove barcodes using /find', async function() {
    let { token } = this.users[2];

    let { body: { tickets } } = await req('tickets/find', {
      query: {
        _id: this.tickets[1]._id
      }
    }, token);
    assert(tickets[0]._id === this.tickets[1]._id);
  });

  it('should return events by urlsafe names', async function() {
    let { token } = this.users[2];
    let { body: { events } } = await req('events/find', {
      query: {
        urlSafe: this.event.urlSafe
      }
    }, token);
    assert(events[0].urlSafe === this.event.urlSafe);
    // assert(tickets[0]._id === this.tickets[1]._id);
  });

  it('should remove ticket barcode from unauthorized user', async function() {
    let { user, token } = this.users[0];
    let { ticket: printedTicket } = (await printTicket(this.event._id, user._id, token)).body;
    let ticketId = printedTicket._id;

    let { ticket } = await reqGET(`events/${this.event._id}/tickets/${ticketId}`);
    assert(ticket._id === ticketId);
    assert(!ticket.barcode);
  });

  it('should retain ticket barcode from authorized user', async function() {
    let { user, token } = this.users[0];
    let { ticket: printedTicket } = (await printTicket(this.event._id, user._id, token)).body;
    let ticketId = printedTicket._id;
    // let { ticket } = (await req(`events/${this.event._id}/tickets/${ticketId}`, {}, token, 'GET')).body;
    let { ticket } = await reqGET(`events/${this.event._id}/tickets/${ticketId}`, token);
    assert(ticket._id === ticketId);
    assert(ticket.barcode);
  });

  it('should redeem ticket when called from event creater', async function() {
    let { user, token } = this.users[0];
    let { ticket: printedTicket } = (await printTicket(this.event._id, user._id, token)).body;

    let res = await req(`events/${this.event._id}/redeem`, {
      ticketId: printedTicket._id
    }, token);
    assert(res.statusCode === 200);
  });

  it('should fail to redeem already redeemed ticket', async function() {
    let { user, token } = this.users[0];
    let { ticket: printedTicket } = (await printTicket(this.event._id, user._id, token)).body;

    let { statusCode } = await req(`events/${this.event._id}/redeem`, {
      ticketId: printedTicket._id
    }, token);
    assert(statusCode === 200);

    let res = await req(`events/${this.event._id}/redeem`, {
      ticketId: printedTicket._id
    }, token);
    assert(res.statusCode === 403);
  });

  it('should not allow user to transfer ticket if they dont own it', async function() {
    let eventCreater = this.users[0];
    let customer1 = this.users[1];
    let { ticket: customer1Ticket } = (await printTicket(
      this.event._id, customer1.user._id, eventCreater.token)
    ).body;
    assert(customer1Ticket.ownerId === customer1.user._id);

    let customer2 = this.users[2];
    let res = await req(`tickets/${customer1Ticket._id}/transfer`, {
      email: customer2.login.email
    }, customer2.token);
    assert(res.body.error);
  });

  it('should allow user to set their ticket for sale', async function() {
    let { user, token } = this.users[0];
    let { ticket: printedTicket } = (await printTicket(this.event._id, user._id, token)).body;

    let { body } = await req(`tickets/${printedTicket._id}/sell`, {
      isForSale: true
    }, token);

    assert(body.ticket.isForSale === true);
  });

  it('should not allow user to sell a ticket they dont own', async function() {
    let { user, token } = this.users[0];
    let { ticket: printedTicket } = (await printTicket(this.event._id, user._id, token)).body;

    let customer1 = this.users[1];
    let res = await req(`tickets/${printedTicket._id}/sell`, {
      isForSale: true
    }, customer1.token);

    assert(res.statusCode === 403);
  });
});
