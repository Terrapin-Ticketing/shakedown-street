const mongoose = require('mongoose');

let EventSchema = mongoose.Schema({
  // eventAddress: { type: String },
  description: { type: String },
  venueName: { type: String },
  venueAddress: { type: String },
  venueState: { type: String },
  venueCity: { type: String },
  venueZip: { type: String },
  primaryColor: { type: String },
  textColor: { type: String },
  imageUrl: { type: String },
  website: { type: String },
  backgroundColor: { type: String },
  // walletAddress: { type: String },
  // encryptedPrivateKey: { type: Number }
});

let EventModel = mongoose.model('Event', EventSchema);

module.exports = EventModel;
