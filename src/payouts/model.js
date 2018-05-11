import mongoose from 'mongoose'

let Payout = new mongoose.Schema({
  date: { type: Date, required: true },
  price: { type: Number, required: true },
  stripeChargeId: { type: String, required: true },
  sellerId: mongoose.Schema.Types.ObjectId,
  buyerId: mongoose.Schema.Types.ObjectId,
  settled: mongoose.Schema.Types.ObjectId,
  isPaid: { type: Boolean, required: true, default: false }
})

let TicketEventModel = mongoose.model('Payout', Payout)
export default TicketEventModel
