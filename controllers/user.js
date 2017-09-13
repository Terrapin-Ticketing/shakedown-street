const Web3 = require('web3');
const config = require('config');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const UserModel = require('../models/user');

let web3 = new Web3(new Web3.providers.HttpProvider(config.web3.httpProvider));

function saltPassword(password) {
  let salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

function symmetricEncrypt(key, text) {
  let algorithm = 'aes256';
  let inputEncoding = 'utf8';
  let outputEncoding = 'hex';

  let cipher = crypto.createCipher(algorithm, key);
  let ciphered = cipher.update(text, inputEncoding, outputEncoding);
  ciphered += cipher.final(outputEncoding);

  return ciphered;
}

class UserApi {
  register(email, password) {
    let wallet = web3.eth.accounts.create();  // create wallet

    let encryptedPrivateKey = symmetricEncrypt(password, wallet.privateKey);

    return UserModel.create({
      email,
      password: saltPassword(password),
      walletAddress: wallet.address,
      encryptedPrivateKey
    });
  }

  getUser(email, password) {
    console.log('email: ', email);
    console.log('password: ', password);
    return new Promise((resolve, reject) => {
      UserModel.findOne({email}).exec((err, user) => {
        console.log('user: ', user);
        if (!user) return reject(new Error('No User'));
        bcrypt.compare(password, user.password, (err, success) => {
          console.log('bcrypt err: ', err);
          console.log('bcrypt success: ', success);
          if (err) return reject(err);
          if (!success) return reject(new Error('Wrong Password'));
          return resolve(user);
        });
      });
    });
  }
}

module.exports = UserApi;
