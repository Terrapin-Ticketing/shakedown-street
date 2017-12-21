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
    let ticket = await TicketModel.findOne({ _id: ticketId }).populate('eventId');
    // only return the ticket barcode if the it is owned by the caller
    if (!ticket) return ticket;
    if (!user || `${ticket.ownerId}` !== `${user._id}`) {
      ticket.barcode = null;
    }
    return ticket;
  }

  async redeemTicket(eventId, ticketId, userId) {
    let event = await eventController.getEventById(eventId);
    // make sure the user calling this function owns the event
    if (`${event.createrId}` !== `${userId}`) return false;

    let ticket = await TicketModel.findOne({ _id: ticketId });
    if (ticket.isRedeemed) return false;

    let redeemedTicket = await TicketModel.findOneAndUpdate({ _id: ticketId }, {
      $set: {
        isRedeemed: true,
        $push: {
          history: { type: 'IS_REDEEMED', isRedeemed: true }
        }
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

  async setTicketOwner(ticketId, user) {
    let ticket = TicketModel.findOneAndUpdate({ _id: ticketId }, {
      $set: {
        isForSale: false,
        ownerId: user._id
      }
    }, { new: true }).populate('eventId');

    return ticket;
  }

  async setIsForSale(ticketId, isForSale, price, user) {
    let ticket = await this.getTicketById(ticketId, user);
    if (`${ticket.ownerId}` !== `${user._id}`) return false;
    // if no price is given, use default price
    if (!price) price = ticket.price;

    ticket = TicketModel.findOneAndUpdate({ _id: ticketId }, {
      $set: {
        isForSale,
        price
      }
    }, { new: true }).populate('eventId');

    return ticket;
  }

  async find(query, user) {
    let tickets = await TicketModel.find(query).populate('eventId');
    return tickets.map((ticket) => {
      if (ticket.ownerId !== user._id) {
        ticket.barcode = null;
      }
      return ticket;
    });
  }

  async findOne(id, user) {
    let ticket = await TicketModel.findOne({ _id: id }).populate('eventId');
    if (ticket.ownerId !== user._id) {
      ticket.barcode = null;
    }
    return ticket;
  }

  async activateThirdPartyTicket(eventId, barcode, user) {
    // TODO: put jamie stuff here
    let price = 1000;
    let ticket = await eventController.createTicket(eventId, user._id, barcode, price);
    return ticket;
  }

  async getTicketByBarcode(barcode) {
    let ticket = await TicketModel.findOne({ barcode }).populate('eventId');
    return ticket;
  }
}

module.exports = TicketApi;
