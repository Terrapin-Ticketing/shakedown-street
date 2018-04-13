const mongoose = require('mongoose')

let TicketSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  barcode: { type: String, index: { unique: true }, required: true },
  price: { type: Number, required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isRedeemed: { type: Boolean, required: true, default: false },
  isForSale: { type: Boolean, required: true, default: false },
  type: { type: String, required: true, default: 'General Admission' },
  dateIssued: { type: Date, required: true }
  // markup percent
})

let TicketModel = mongoose.model('Ticket', TicketSchema)
export default TicketModel
