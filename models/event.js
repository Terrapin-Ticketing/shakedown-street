import mongoose from 'mongoose';
import config from 'config';

let EventSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId, ref: 'User',
    default: config.adminId
  },
  createrId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tickets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' }],

  name: { type: String, unique: true, required: true },
  urlSafe: { type: String, unique: true, required: true },
  description: { type: String },
  venue: {
    name: { type: String },
    address: { type: String },
    state: { type: String },
    city: { type: String },
    zip: { type: String },
  },
  primaryColor: { type: String },
  textColor: { type: String },
  imageUrl: { type: String },
  website: { type: String },
  backgroundColor: { type: String }
});

let EventModel = mongoose.model('Event', EventSchema);

module.exports = EventModel;
