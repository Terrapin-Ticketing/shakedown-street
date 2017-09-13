const mongoose = require('mongoose');

let UserSchema = mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
  walletAddress: String,
  encryptedPrivateKey: String
});

let UserModel = mongoose.model('User', UserSchema);

module.exports = UserModel;
