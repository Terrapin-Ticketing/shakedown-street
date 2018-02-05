const mongoose = require('mongoose');

// enum

let TicketSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  barcode: { type: String, index: { unique: true }, required: true },
  price: { type: Number, required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isRedeemed: { type: Boolean, required: true, default: false },
  isForSale: { type: Boolean, required: true, default: false },
  type: { type: String, required: true, default: 'General Admission' },
  dateIssued: { type: Date, required: true }
});

let TicketModel = mongoose.model('Ticket', TicketSchema);

export default TicketModel;

export const txTypes = [
  {
    type: 'OWNER_CHANGE',
    ownerId: mongoose.Schema.Types.ObjectId
  }, {
    type: 'PRICE_CHANGE',
    newPrice: Number
  }, {
    type: 'IS_FOR_SALE_CHANGE',
    isForSale: Boolean
  }, {
    type: 'IS_REDEEMED',
    isRedeemed: Boolean
  }, {
    type: 'BARCODE_CHANGE',
    barcode: String
  }
];



/*
Post save new user: send email
*/
