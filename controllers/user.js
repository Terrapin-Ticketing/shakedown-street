const bcrypt = require('bcrypt');

const UserModel = require('../models/user');

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
}

module.exports = UserApi;
