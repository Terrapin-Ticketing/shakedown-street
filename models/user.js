var mongoose = require('mongoose');

var UserSchema = mongoose.Schema({
  email: String,
  password: String,
  walletAddress: String,
  privateKey: String
});

var UserModel = mongoose.model('User', UserSchema);

module.exports = UserModel;
