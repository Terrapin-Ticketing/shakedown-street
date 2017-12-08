import mongoose from 'mongoose';
import config from 'config';

let EventSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId, ref: 'User',
    default: config.adminId
  },
  createrId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tickets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' }],

  description: { type: String },
  venueName: { type: String },
  venueAddress: { type: String },
  venueState: { type: String },
  venueCity: { type: String },
  venueZip: { type: String },

  primaryColor: { type: String },
  textColor: { type: String },
  imageUrl: { type: String },
  website: { type: String },
  backgroundColor: { type: String }
});

let EventModel = mongoose.model('Event', EventSchema);

module.exports = EventModel;
