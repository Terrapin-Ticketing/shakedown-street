const mongoose = require('mongoose');

let TicketSchema = new mongoose.Schema({
  // eventId : { type: , ref: 'Person' },
  barcode: { type: String, unique: true, required: true },
  publicId: { type: String, unique: true, required: true },
  price: { type: Number, required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isRedeemed: { type: Boolean, required: true, default: false }
});

let TicketModel = mongoose.model('Ticket', TicketSchema);

module.exports = TicketModel;


/*
Post save new user: send email
*/
