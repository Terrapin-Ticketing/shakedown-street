import mongoose from 'mongoose';
const uuidv1 = require('uuid/v4');

import EventModel from '../models/event';
import TicketModel from '../models/ticket';
import UserModel from '../models/user';

const EventApi = require('../controllers/event');
let eventController = new EventApi();

const UserApi = require('../controllers/user');
let userController = new UserApi();

class TicketApi {
  async getTicketById(ticketId, user) {
    let ticket = await TicketModel.findOne({ _id: ticketId });
    // only return the ticket barcode if the it is owned by the caller
    if (!user || `${ticket.ownerId}` !== `${user._id}`) {
      ticket.barcode = null;
    }
    return ticket;
  }

  async redeemTicket(eventId, ticketId, userId) {
    let event = await eventController.getEvent(eventId);
    // make sure the user calling this function owns the event
    if (`${event.createrId}` !== `${userId}`) return false;

    let ticket = await TicketModel.findOne({ _id: ticketId });
    if (ticket.isRedeemed) return false;

    let redeemedTicket = await TicketModel.findOneAndUpdate({ _id: ticketId }, {
      $set: {
        isRedeemed: true
      }
    }, { new: true });
    return !!redeemedTicket;
  }

  async transferTicket(ticketId, transferToEmail, user) {
    let ticket = await this.getTicketById(ticketId, user);
    if (`${ticket.ownerId}` !== `${user._id}`) return false;

    let transferToUser = await UserModel.findOne({ email: transferToEmail });
    // if user doesn't exist create one
    if (!transferToUser) {
      let event = await EventModel.findOne({ _id: ticket.eventId });
      transferToUser = await userController.createPlaceholderUser(transferToEmail, user.email, event.name);
    }

    let transferedTicket = await TicketModel.findOneAndUpdate({ _id: ticketId }, {
      $set: {
        ownerId: transferToUser._id,
        barcode: uuidv1()
      }
    }, { new: true });

    transferedTicket.barcode = null;
    return transferedTicket;
  }

  async setIsForSale(ticketId, isForSale, user) {
    let ticket = await this.getTicketById(ticketId, user);
    if (`${ticket.ownerId}` !== `${user._id}`) return false;

    ticket = TicketModel.findOneAndUpdate({ _id: ticketId }, {
      $set: {
        isForSale
      }
    }, { new: true });

    return ticket;
  }

  async registerTicket(ticket, eventId, user) {
    /*
    lookup ticket to make sure it's real
    get tickets price
    */
    let price = 10; // TODO:

    let event = await EventModel.findOne({ _id: eventId });

    // create new ticket for this event
    let newTicket = await TicketModel.create({
      ...ticket,
      price,
      ownerId: mongoose.mongo.ObjectId(user._id),
      eventId: event._id
    });

    await EventModel.findOneAndUpdate({ _id: eventId }, {
      $push: {
        tickets: newTicket._id
      }
    });

    await UserModel.findOneAndUpdate({ _id: user._id }, {
      $push: {
        tickets: newTicket._id
      }
    });

    return newTicket;
  }

  async find(query, user) {
    let tickets = await TicketModel.find(query);
    return tickets.map((ticket) => {
      if (ticket.ownerId !== user._id) {
        ticket.barcode = null;
      }
      return ticket;
    });
  }

  async findOne(id, user) {
    let ticket = await TicketModel.findOne({ _id: id });
    if (ticket.ownerId !== user._id) {
      ticket.barcode = null;
    }
    return ticket;
  }
}

module.exports = TicketApi;
