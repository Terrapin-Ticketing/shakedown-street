import mongoose from 'mongoose'

let Transfer = new mongoose.Schema({
  date: { type: Date, required: true },
  ticketId: { type: mongoose.Schema.Types.ObjectId, required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  recieverId: { type: mongoose.Schema.Types.ObjectId, required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, required: true }
})

let TransferModel = mongoose.model('Transfer', Transfer)
export default TransferModel
