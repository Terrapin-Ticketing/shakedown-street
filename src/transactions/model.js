const mongoose = require('mongoose')

let TicketEventSchema = new mongoose.Schema({
  date: { Type: Date },
  ticketId: { Type: ObjectId},
  type: { enum[ 'SELL', 'ACTIVATE', 'PRICE_CHANGE', 'TRANSFER', 'SET_IS_FOR_SALE']  },
  recipientUserId: {},
  senderUserId: {},
  newParams: {
    price:,
    isForSale:,
  }
})

let TicketEventModel = mongoose.model('TicketEvent', TicketEventSchema)
export default TicketEventModel

/*
price change
isForSale change
transfer (ownerId change)
sell (ownerId change)
activated
*/

// Payments/Payouts
// {
//   date: ,
//   price: ,
//   stripeChargeId: ,
//   sellerId: ,
//   buyerId: ,
//   settled: ,
// }
