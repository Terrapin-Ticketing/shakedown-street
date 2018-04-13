import mongoose from 'mongoose'
// import config from 'config'

let EventSchema = new mongoose.Schema({
  integrationType: { type: String }, // eventType?


  totalMarkupPercent: { type: Number }, // this would be nice on "ticketType"


  date: { type: String, required: true },
  name: { type: String, index: { unique: true }, required: true },
  urlSafe: { type: String, index: { unique: true }, required: true },
  description: { type: String },
  venue: {
    name: { type: String },
    address: { type: String },
    state: { type: String },
    city: { type: String },
    zip: { type: String }
  },
  primaryColor: { type: String },
  textColor: { type: String },
  imageUrl: { type: String },
  thumbnail_image_url: { type: String },

  website: { type: String },
  backgroundColor: { type: String },

  // * Third Party *

  username: { type: String },
  password: { type: String },

  isThirdParty: { type: Boolean, required: true, default: false },
  eventManager: { type: String }, // eventType?

  domain: { type: String }, //
  issueTicketRoute: { type: String },

  ticketTypes: {},

  externalEventId: { type: String },
  promoCode: { type: String },



  queryDateStart: { type: Date },
  queryDateEnd: { type: Date }

  // loginDomain: { type: Boolean, required: true, default: false },
  // domain: { type: String }
})

let EventModel = mongoose.model('Event', EventSchema)
module.exports = EventModel