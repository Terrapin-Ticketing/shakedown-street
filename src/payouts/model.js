import mongoose from 'mongoose'

let Payout = new mongoose.Schema({
  date: { type: Date, required: true },
  price: { type: Number, required: true },
  stripeChargeId: { type: String },
  ticketId: { type: mongoose.Schema.Types.ObjectId, required: true },
  sellerId: { type: mongoose.Schema.Types.ObjectId, required: true },
  buyerId: { type: mongoose.Schema.Types.ObjectId, required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, required: true },
  isPaid: { type: Boolean, required: true, default: false }
})

let TicketEventModel = mongoose.model('Payout', Payout)
export default TicketEventModel
