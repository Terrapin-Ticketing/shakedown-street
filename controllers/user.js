const bcrypt = require('bcrypt');

const UserModel = require('../models/user');
const uuidv1 = require('uuid/v4');

import { ticketReceived } from '../utils/requireEmail';

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
    // await ticketReceived(email, )
    let user = await this.signup(email, uuidv1());
    // send 'account created' email
    return user;
  }
}

module.exports = UserApi;
