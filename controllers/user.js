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
  signup(email, password, privateKey) {
    let wallet;
    if (privateKey) {
      wallet = web3.eth.accounts.privateKeyToAccount(`0x${privateKey}`);
      console.log(wallet);
    } else {
      wallet = web3.eth.accounts.create(); // create wallet
    }

    let encryptedPrivateKey = symmetricEncrypt(password, wallet.privateKey);

    return web3.eth.getBalance(wallet.address).then((data) => {
      console.log('BALANCE:', data);

      return UserModel.create({
        email,
        password: saltPassword(password),
        walletAddress: wallet.address,
        encryptedPrivateKey
      });
    });

    // return UserModel.create({
    //   email,
    //   password: saltPassword(password),
    //   walletAddress: wallet.address,
    //   encryptedPrivateKey
    // });
  }

  getUser(email, password) {
    return new Promise((resolve, reject) => {
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
