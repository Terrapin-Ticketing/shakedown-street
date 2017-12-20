import bcrypt from 'bcrypt';
import redis from 'redis';
import config from 'config';

let env = config.env;

const UserModel = require('../models/user');
const uuidv1 = require('uuid/v4');

import { emailRecievedTicket, emailPasswordChange, emailSoldTicket } from '../utils/requireEmail';

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

  async getUserByEmail(email) {
    let user = UserModel.findOne({ email });
    return user;
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

  async getUserById(id) {
    return await UserModel.findOne({ _id: id }).populate('eventId');
  }

  // async createPlaceholderUser(email, fromUser, eventName) {
  //   await emailTransferTicket(email, fromUser, eventName);
  //   let user = await this.signup(email, uuidv1());
  //   return user;
  // }

  async createPlaceholderUser(email) {
    let placeHolderPass = uuidv1();
    let user = await this.signup(email, placeHolderPass);
    return user;
  }

  async requestPasswordChange(email, sendEmail = true) {
    let token = uuidv1();
    await new Promise((resolve) => {
      client.hset('set-password', token, email, resolve);
    });
    let passwordChangeUrl = `${config.clientDomain}/set-password/${token}`;
    // send email
    if (sendEmail) await emailPasswordChange(email, passwordChangeUrl);
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
      client.hget('set-password', token, async(err, email) => {
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
      client.hset('set-password', token, false, resolve);
    });

    return user;
  }

  async setStripe(userId, stripe) {
    let user = await UserModel.findOneAndUpdate({ _id: userId }, {
      $set: {
        ...stripe,
        charges: {
          $push: {
            charges: stripe.charge
          }
        }
      }
    }, { new: true });
    return user;
  }

  async setStripeId(userId, stripeId) {
    let user = await UserModel.findOneAndUpdate({ _id: userId }, {
      $set: {
        stripe: {
          id: stripeId
        }
      }
    }, { new: true });
    return user;
  }

  async addCharge(userId, charge) {
    let user = await UserModel.findOneAndUpdate({ _id: userId }, {
      $set: {
        charges: {
          $push: {
            charges: charge
          }
        }
      }
    }, { new: true });
    return user;
  }

  async sendRecievedTicketEmail(user, ticket) {
    let event = ticket.eventId;
    await emailRecievedTicket(user.email, event);
  }

  async sendSoldTicketEmail(user, ticket) {
    await emailSoldTicket(user.email, ticket);
  }
}

module.exports = UserApi;
