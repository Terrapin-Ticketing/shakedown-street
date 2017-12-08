import config from 'config';
import assert from 'assert';
import shortid from 'shortid';
import request from 'request';
import jwt from 'jsonwebtoken';
import pasync from 'pasync';

let baseUrl = `http://localhost:${config.port}`;
let NUM_USERS = 10;

async function req(route, body, cookieValue, method = 'POST', json = true) {
  if (method === 'GET') body = undefined;
  let jar = request.jar();
  let cookie = request.cookie(`cookieToken=${cookieValue}`);
  jar.setCookie(cookie, baseUrl);
  let options = {
    method,
    uri: `${baseUrl}/${route}`,
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

async function printTicket(eventId, ownerId, token) {
  return await req(`events/${eventId}/tickets`, {
    ticket: {
      price: 1000
    },
    ownerId
  }, token);
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
    let { body } = await req('events', {
      event: {
        description: 'testing'
      }
    }, token);
    this.eventId = body._id;
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
        description: 'testing'
      }
    }, token);
    assert(res.statusCode === 200);
  });

  it('should print a ticket', async function() {
    let { user, token } = this.users[0];
    let res = await printTicket(this.eventId, user._id, token);
    let { ticket } = res.body;
    assert(ticket.ownerId === user._id);
  });

  it('should prevent unauthorized users from printing tickets', async function() {
    let { user, token } = this.users[1];
    let res = await req(`events/${this.eventId}/tickets`, {
      ticket: {
        price: 1000
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
      let res = await printTicket(this.eventId, user._id, token);
      let { ticket } = res.body;
      assert(ticket);
      ticketIds.push(ticket._id);
    });

    let res = await req(`events/${this.eventId}/tickets`, {}, {}, 'GET');
    assert(res.body.tickets.length >= ticketIds.length);
  });

  it('should remove ticket barcode from unauthorized user', async function() {
    let { user, token } = this.users[0];
    let { ticket: printedTicket } = (await printTicket(this.eventId, user._id, token)).body;
    let ticketId = printedTicket._id;
    let { ticket } = (await req(`events/${this.eventId}/tickets/${ticketId}`, {}, {}, 'GET')).body;
    assert(ticket._id === ticketId);
    assert(!ticket.barcode);
  });

  it('should retain ticket barcode from authorized user', async function() {
    let { user, token } = this.users[0];
    let { ticket: printedTicket } = (await printTicket(this.eventId, user._id, token)).body;
    let ticketId = printedTicket._id;
    let { ticket } = (await req(`events/${this.eventId}/tickets/${ticketId}`, {}, token, 'GET')).body;
    assert(ticket._id === ticketId);
    assert(ticket.barcode);
  });

  it('should redeem ticket unredeemed ticket', async function() {
    let { user, token } = this.users[0];
    let { ticket: printedTicket } = (await printTicket(this.eventId, user._id, token)).body;

    let res = await req(`events/${this.eventId}/redeem`, {
      ticketId: printedTicket._id
    }, token);
    assert(res.statusCode === 200);
  });

  it('should fail to redeem already redeemed ticket', async function() {
    let { user, token } = this.users[0];
    let { ticket: printedTicket } = (await printTicket(this.eventId, user._id, token)).body;

    let { statusCode } = await req(`events/${this.eventId}/redeem`, {
      ticketId: printedTicket._id
    }, token);
    assert(statusCode === 200);

    let res = await req(`events/${this.eventId}/redeem`, {
      ticketId: printedTicket._id
    }, token);
    assert(res.statusCode === 403);
  });

  it('should allow user to transfer ticket to another user', async function() {
    let eventCreater = this.users[0];
    let customer1 = this.users[1];
    let { ticket: customer1Ticket } = (await printTicket(
      this.eventId, customer1.user._id, eventCreater.token)
    ).body;
    assert(customer1Ticket.ownerId === customer1.user._id);

    let { body: { ticket: transferTicket } } = await req(`tickets/${customer1Ticket._id}/transfer`, {
      email: 'newUser@gmail.com'
    }, customer1.token);

    assert(transferTicket.ownerId !== customer1.user._id);
  });

  it('should not allow user to transfer ticket if they dont own it', async function() {
    let eventCreater = this.users[0];
    let customer1 = this.users[1];
    let { ticket: customer1Ticket } = (await printTicket(
      this.eventId, customer1.user._id, eventCreater.token)
    ).body;
    assert(customer1Ticket.ownerId === customer1.user._id);

    let customer2 = this.users[2];
    let res = await req(`tickets/${customer1Ticket._id}/transfer`, {
      email: 'newUser@gmail.com'
    }, customer2.token);
    assert(res.statusCode === 403);
  });

});
