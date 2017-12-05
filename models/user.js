const mongoose = require('mongoose');

let UserSchema = mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: {type: String, required: true}
});

let UserModel = mongoose.model('User', UserSchema);

module.exports = UserModel;
