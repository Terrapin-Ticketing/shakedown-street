import mongoose from 'mongoose'

let Payout = new mongoose.Schema({
  date: { type: Date, required: true },
  price: { type: Number, required: true },
  stripeChargeId: { type: String },
  ticketId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Ticket' },
  sellerId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  buyerId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  eventId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Event' },
  isPaid: { type: Boolean, required: true, default: false },
  prevBarcode: { type: String }
})

let TicketEventModel = mongoose.model('Payout', Payout)
export default TicketEventModel
