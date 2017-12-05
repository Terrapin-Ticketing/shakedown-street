let config = require('config');
let assert = require('assert');
let shortid = require('shortid');
let request = require('request');

let baseUrl = `http://localhost:${config.port}`;

async function req(route, body, cookieValue, method = 'POST', json = true) {
  if (method === 'GET') json = body = undefined;
  let jar;
  if (cookieValue) {
    jar = request.jar();
    let cookie = request.cookie(`cookieToken=${cookieValue}`);
    jar.setCookie(cookie, baseUrl);
  }
  let options = {
    method,
    uri: `${baseUrl}/${route}`,
    body,
    json,
    jar
  };
  return await new Promise((resolve, reject) => {
    request(options, (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
  });
}

describe('User & Auth', function() {
  before(async function() {
    this.user = {
      email: `${shortid.generate()}@test.com`,
      password: 'test'
    };
    let { body: { token } } = await req('signup', this.user);
    this.jwtToken = token;
  });

  it('should log in', async function() {
    let { body: { token } } = await req('login', this.user);
    assert(this.jwtToken === token && this.jwtToken && token);
  });

  it('should create an event', async function() {
    let { body: { token } } = await req('login', this.user);
    let res = await req('events', {
      event: {
        description: 'testing'
      }
    }, token);
    assert(res.statusCode === 200);
  });

});
