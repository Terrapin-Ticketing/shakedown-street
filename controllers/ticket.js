import mongoose from 'mongoose';
const uuidv1 = require('uuid/v4');

import EventModel from '../models/event';
import TicketModel from '../models/ticket';
import UserModel from '../models/user';

const EventApi = require('../controllers/event');
let eventController = new EventApi();

const UserApi = require('../controllers/user');
let userController = new UserApi();

const ThirdPartyControllers = require('./3rdParty').default;
let thirdPartyControllers = {};
Object.keys(ThirdPartyControllers).forEach((key) => {
  thirdPartyControllers[key] = new ThirdPartyControllers[key]();
});

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

  async _transferTicket(ticketId, inputtedTransferToUser, user) {
    let ticket = await this.getTicketById(ticketId, user);
    if (`${ticket.ownerId}` !== `${user._id}`) return { error: 'User doesn\'t own this ticket' };

    let event = await EventModel.findOne({ _id: ticket.eventId });
    let newBarcode = uuidv1(); // used for non third party events
    if (event.isThirdParty) {
      let thirdPartyEvent = thirdPartyControllers[event.eventManager];
      let success = await thirdPartyEvent.deactivateTicket(ticket.barcode, event);
      if (!success) return { error: 'Deactivation Failed' };

      let oldTicket = await thirdPartyEvent.getTicketInfo(ticket.barcode, event);
      newBarcode = await thirdPartyEvent.issueTicket(event, oldTicket, inputtedTransferToUser);
      if (!newBarcode) return { error: 'Ticket Creation Failed' };
    }
    return newBarcode;
  }

  async transferTicket(ticketId, inputtedTransferToUser, user) {
    let newBarcode = await this._transferTicket(ticketId, inputtedTransferToUser, user);
    let ticket = await this.getTicketById(ticketId, user);

    let transferToUser = await userController.getUserByEmail(inputtedTransferToUser.email);
    // if user doesn't exist create one
    if (!transferToUser) {
      transferToUser = await userController.createTransferPlaceholderUser(inputtedTransferToUser.email);
      await userController.emailTransferTicket(inputtedTransferToUser.email, user.email, ticket);
    } else {
      await userController.sendRecievedTicketEmail(transferToUser, ticket);
    }

    let transferedTicket = await TicketModel.findOneAndUpdate({ _id: ticketId }, {
      $set: {
        ownerId: transferToUser._id,
        barcode: newBarcode,
        isForSale: false
      }
    }, { new: true });

    // whoever called this doesn't own the ticket anymore
    transferedTicket.barcode = null;
    return transferedTicket;
  }

  async transferPurchasedTicket(ticketId, inputtedTransferToUser, user) {
    let newBarcode = await this._transferTicket(ticketId, inputtedTransferToUser, user);
    let ticket = await this.getTicketById(ticketId, user);

    let transferToUser = await userController.getUserByEmail(inputtedTransferToUser.email);
    // if user doesn't exist create one

    await userController.sendPurchaseEmail(transferToUser, ticket);

    let transferedTicket = await TicketModel.findOneAndUpdate({ _id: ticketId }, {
      $set: {
        ownerId: transferToUser._id,
        barcode: newBarcode,
        isForSale: false
      }
    }, { new: true }).populate('eventId');
    // whoever called this doesn't own the ticket anymore
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
    let userTickets = tickets.map((ticket) => {
      if (ticket.ownerId !== user._id) {
        ticket.barcode = null;
      }
      return ticket;
    });
    return userTickets;
  }

  async findOne(id, user) {
    let ticket = await TicketModel.findOne({ _id: id }).populate('eventId');
    if (ticket.ownerId !== user._id) {
      ticket.barcode = null;
    }
    return ticket;
  }

  async isValidTicket(event, barcode) {
    if (!event.isThirdParty) return { error: 'Invalid Event' };
    let { eventManager } = event;

    let thirdPartyEvent = thirdPartyControllers[eventManager];
    return await thirdPartyEvent.isValidTicket(barcode, event);
  }

  async activateThirdPartyTicket(event, barcode, user) {
    if (!event.isThirdParty) return { error: 'Invalid Event' };
    let { _id, eventManager } = event;
    let thirdPartyEvent = thirdPartyControllers[eventManager];
    let ticketInfo = await thirdPartyEvent.getTicketInfo(barcode, event);
    if (!ticketInfo || ticketInfo.Status === 'void') return { error: 'Invalid Ticket ID' };

    if (!ticketInfo.price && ticketInfo.price !== 0) throw new Error('Original price of ticket not set');
    let price = ticketInfo.price;

    if (!ticketInfo.type) throw new Error('Original ticket type not set');
    let type = ticketInfo.type;

    let ticket = await eventController.createTicket(_id, user._id, barcode, price, type);
    return ticket;
  }

  async getTicketByBarcode(barcode) {
    let ticket = await TicketModel.findOne({ barcode }).populate('eventId');
    return ticket;
  }
}

module.exports = TicketApi;
