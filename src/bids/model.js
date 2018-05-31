import mongoose from 'mongoose'

let Bids = new mongoose.Schema({
  date: { type: Date, required: true },
  placerId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Ticket' },
  price: { type: Number, required: true },
  ticketType: { type: String, required: true },
  stripeToken: { type: String, required: true }
})

let BidsModel = mongoose.model('Bids', Bids)
export default BidsModel
