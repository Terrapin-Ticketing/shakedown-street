let config = require('config');
let assert = require('assert');
let rp = require('request-promise');
let shortid = require('shortid');

let baseUrl = `http://localhost:${config.port}`;

describe('User & Auth', function() {
  before(async function() {
    this.user = {
      email: `${shortid.generate()}@test.com`,
      password: 'test'
    };
    let options = {
      method: 'POST',
      uri: `${baseUrl}/signup`,
      body: this.user,
      json: true
    };
    let res = await rp(options);
    this.jwtToken = res.token;
  });

  it('should log in', async function() {
    let options = {
      method: 'POST',
      uri: `${baseUrl}/login`,
      body: this.user,
      json: true
    };
    let res = await rp(options);
    assert(this.jwtToken === res.token);
  });
});
