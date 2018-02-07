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

  async createTicket(eventId, ownerId, barcode, price, type) {
    let user = await UserModel.findOne({ _id: ownerId });
    if (!user) return { error: `Invalid ticket owner ${ownerId}` };

    let newTicket = await TicketModel.create({
      barcode,
      ownerId: mongoose.mongo.ObjectId(ownerId),
      dateIssued: new Date(),
      price,
      type
    });

    let event = await EventModel.findOneAndUpdate(
      { _id: eventId },
      { $push: {
        tickets: newTicket._id
      } }
    );

    newTicket = await TicketModel.findOneAndUpdate({
      _id: newTicket._id
    }, {
      $set: {
        eventId: event._id
      }
    }, { new: true }).populate('eventId');

    return newTicket;
  }

  async printTicket(callerId, eventId, ticket, ownerId) {
    let user = await UserModel.findOne({ _id: ownerId });

    let barcode = uuidv1();
    let newTicket = await TicketModel.create({
      ...ticket,
      barcode,
      dateIssued: new Date(),
      ownerId: mongoose.mongo.ObjectId(user._id)
    });

    let event = await EventModel.findOneAndUpdate(
      { _id: eventId },
      { $push: {
        tickets: newTicket._id
      } }
    );

    await TicketModel.findOneAndUpdate({
      _id: newTicket._id
    }, {
      $set: {
        eventId: event._id
      }
    });
    // event.tickets.push(newTicket._id);
    // don't need to remove barcode since this printTicket must
    // be called by the event creater
    return newTicket;
  }

  async getEventById(eventId) {
    let event = await EventModel.findOne({ _id: eventId });
    return event;
  }

  async getTicketsByEventId(eventId) {
    let event = await EventModel.findOne({ _id: eventId });
    return event.tickets;
  }

  async getEventByUrlSafe(urlSafe) {
    let event = await EventModel.findOne({ urlSafe });
    return event;
  }

  async find(query) {
    let events = await EventModel.find(query);
    return events;
  }
}

module.exports = EventApi;
