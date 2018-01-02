const mongoose = require('mongoose');

let UserSchema = mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  tickets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' }],
  stripe: {
    id: { type: String },
    source: { }, // any arbitrary document
    charges: [{ }] // all stripe charges
  }
});

let UserModel = mongoose.model('User', UserSchema);

module.exports = UserModel;
