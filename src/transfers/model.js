import mongoose from 'mongoose'

let Transfer = new mongoose.Schema({
  date: { type: Date, required: true },
  ticketId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Ticket' },
  senderId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  recieverId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  eventId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Event' },
  prevBarcode: { type: String }
})

let TransferModel = mongoose.model('Transfer', Transfer)
export default TransferModel
