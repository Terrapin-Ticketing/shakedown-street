const mongoose = require('mongoose');

let EventSchema = mongoose.Schema({
  eventAddress: { type: String },
  primaryColor: { type: String },
  textColor: { type: String },
  imageUrl: { type: String },
  description: { type: String },
  website: { type: String },
  backgroundColor: { type: String },
  venueName: { type: String },
  venueAddress: { type: String },
  venueState: { type: String },
  venueCity: { type: String },
  venueZip: { type: String },
  email: { type: String },
  password: { type: String },
  walletAddress: { type: String },
  encryptedPrivateKey: { type: Number }
});

let EventModel = mongoose.model('Event', EventSchema);

module.exports = EventModel;
