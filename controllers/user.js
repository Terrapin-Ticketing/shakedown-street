import bcrypt from 'bcrypt';
import redis from 'redis';
import config from 'config';

let env = config.env;

const UserModel = require('../models/user');
const EventModel = require('../models/event');


const uuidv1 = require('uuid/v4');

import { emailRecievedTicket, emailPasswordChange, emailSoldTicket, emailTransferTicket, emailPurchaseTicket, emailInternalPaymentNotification } from '../utils/requireEmail';

let client = redis.createClient();

function saltPassword(password) {
  let salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

class UserApi {
  async signup(email, password) {
    return await UserModel.create({
      email: email.toLowerCase(),
      password: saltPassword(password)
    });
  }

  async getUserByEmail(email) {
    let user = await UserModel.findOne({ email: email.toLowerCase() });
    return user;
  }

  async loginUser(email, password) {
    return await new Promise(async(resolve, reject) => {
      let user = await this.getUserByEmail(email);
      bcrypt.compare(password, user.password, (err, success) => {
        if (err) return reject(err);
        if (!success) return reject(new Error('Wrong Password'));
        return resolve(user);
      });
    });
  }

  async getUserById(id) {
    return await UserModel.findOne({ _id: id }).populate('eventId');
  }

  async createTransferPlaceholderUser(email) {
    let user = await this.signup(email, uuidv1());
    return user;
  }

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
        let user = await UserModel.findOneAndUpdate({ email: email.toLowerCase() }, {
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

  async updatePayoutMethod(userId, method, value) {
    let payout = (await UserModel.findOne({ _id: userId })).payout;
    payout[method] = value,
    payout.default = method;
    let user = await UserModel.findOneAndUpdate({ _id: userId }, {
      $set: { payout }
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

  async emailTransferTicket(email, fromUser, ticket) {
    await emailTransferTicket(email, fromUser, ticket);
  }

  async sendRecievedTicketEmail(user, ticket) {
    await emailRecievedTicket(user, ticket);
  }

  async sendSoldTicketEmail(user, ticket) {
    await emailSoldTicket(user, ticket);
  }

  async sendPurchaseEmail(user, ticket) {
    await emailPurchaseTicket(user, ticket);
  }

  async sendInternalPaymentNotificationEmail(originalOwner, newOwner, ticket) {
    await emailInternalPaymentNotification(originalOwner, newOwner, ticket);
  }

}

module.exports = UserApi;
