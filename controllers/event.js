import mongoose from 'mongoose';

import EventModel from '../models/event';
import TicketModel from '../models/ticket';
import UserModel from '../models/user';

const uuidv1 = require('uuid/v4');

class EventApi {
  async createEvent(event, eventOwnerId) {
    return await EventModel.create({
      ...event,
      createrId: eventOwnerId
    });
  }

  async isEventOwner(userId, eventId) {
    let event = await EventModel.findOne({ _id: eventId });
    return `${event.createrId}` === `${userId}`;
  }

  async printTicket(callerId, eventId, ticket, ownerId) {
    try {
      let user = await UserModel.findOne({ _id: ownerId });

      let publicId = uuidv1();
      let barcode = uuidv1();
      let newTicket = await TicketModel.create({
        ...ticket,
        publicId,
        barcode,
        ownerId: mongoose.mongo.ObjectId(user._id)
      });

      let event = await EventModel.findOneAndUpdate(
        { _id: eventId },
        { $push: {
          tickets: newTicket._id
        } },
        { upsert: true }
      );
      event.tickets.push(newTicket._id);
      // don't need to remove barcode since this printTicket must
      // be called by the event creater
      return newTicket;
    } catch (e) {
      console.log('logger', e);
    }
  }

  async getTicketsByEventId(eventId) {
    let event = await EventModel.findOne({ _id: eventId });
    return event.tickets;
  }

  async getEvent(eventId) {
    return await EventModel.findOne({ _id: eventId });
  }
}

module.exports = EventApi;
