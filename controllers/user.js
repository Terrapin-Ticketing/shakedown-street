var Web3 = require('web3');
var config = require('config');

var UserModel = require('../models/user');

var web3 = new Web3(new Web3.providers.HttpProvider(config.web3.httpProvider));

class UserApi {
  register(email, password) {
    let wallet = web3.eth.accounts.create();
    return UserModel.create({ email, password, walletAddress: wallet.address, privateKey: wallet.privateKey });
  }

  getUser(email, password) {
    return new Promise((resolve, reject) => {
      UserModel.findOne({email, password}).exec((err, res) => {
        if (err) return reject(err);
        if (!res) return reject(new Error('no account'));
        return resolve(res);
      });
    });
  }
}

module.exports = UserApi;
