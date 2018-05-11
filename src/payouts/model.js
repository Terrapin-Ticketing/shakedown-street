import mongoose from 'mongoose'

let Payout = new mongoose.Schema({
  date: { type: Date },
  price: { type: Number },
  stripeChargeId: { type: String },
  sellerId: mongoose.Schema.Types.ObjectId,
  buyerId: mongoose.Schema.Types.ObjectId,
  settled: mongoose.Schema.Types.ObjectId
})

let TicketEventModel = mongoose.model('Payout', Payout)
export default TicketEventModel
