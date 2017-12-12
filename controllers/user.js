import bcrypt from 'bcrypt';
import redis from 'redis';
import config from 'config';

let env = config.env;

const UserModel = require('../models/user');
const uuidv1 = require('uuid/v4');

import { emailTicketReceived, emailPasswordChange } from '../utils/requireEmail';

let client = redis.createClient();

function saltPassword(password) {
  let salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

class UserApi {
  async signup(email, password) {
    return await UserModel.create({
      email,
      password: saltPassword(password)
    });
  }

  async getUser(email, password) {
    return await new Promise((resolve, reject) => {
      UserModel.findOne({email}).exec((err, user) => {
        if (!user) return reject(new Error('This user doesn\'t exist.'));
        bcrypt.compare(password, user.password, (err, success) => {
          if (err) return reject(err);
          if (!success) return reject(new Error('Wrong Password'));
          return resolve(user);
        });
      });
    });
  }

  async createPlaceholderUser(email, fromUser, eventName) {
    await emailTicketReceived(email, fromUser, eventName);
    let user = await this.signup(email, uuidv1());
    return user;
  }

  async requestPasswordChange(email) {
    let token = uuidv1();
    await new Promise((resolve) => {
      client.hset('forgot-password', token, email, resolve);
    });
    let passwordChangeUrl = `${config.clientDomain}/forgot-password/${token}`;
    // send email
    await emailPasswordChange(email, passwordChangeUrl);
    //   email: { accepted: [ 'reeder@terrapinticketing.com' ],
    // rejected: [],
    // envelopeTime: 138,
    // messageTime: 500,
    // messageSize: 442,
    // response: '250 2.0.0 OK 1513053296 h6sm7140078ywe.31 - gsmtp',
    // envelope:
    //  { from: 'info@terrapinticketing.com',
    //    to: [ 'reeder@terrapinticketing.com' ] },
    // messageId: '<654d6263-5d85-efd1-62e8-334ae8bbf433@terrapinticketing.com>' }
    return passwordChangeUrl;
  }

  async changePassword(token, password) {
    // update password of given token
    let user = await new Promise((resolve, reject) => {
      client.hget('forgot-password', token, async(err, email) => {
        if (err) return reject(err);
        let user = await UserModel.findOneAndUpdate({ email }, {
          $set: {
            password: saltPassword(password)
          }
        }, { new: true });
        resolve(user);
      });
    });

    // unset client token
    await new Promise((resolve) => {
      client.hset('forgot-password', token, false, resolve);
    });

    return user;
  }
}

module.exports = UserApi;
