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

  console.log('Ciphering "%s" with key "%s" using %s', text, key, algorithm);

  let cipher = crypto.createCipher(algorithm, key);
  let ciphered = cipher.update(text, inputEncoding, outputEncoding);
  ciphered += cipher.final(outputEncoding);

  console.log('Result in %s is "%s"', outputEncoding, ciphered);

  return ciphered;

  // * SYM DECRYPT *
  //
  // var decipher = crypto.createDecipher(algorithm, key);
  // var deciphered = decipher.update(ciphered, outputEncoding, inputEncoding);
  // deciphered += decipher.final(inputEncoding);
  //
  // console.log(deciphered);
  // assert.equal(deciphered, text, 'Deciphered text does not match!');
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
