import mongoose from 'mongoose';
const uuidv1 = require('uuid/v4');

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
      transferToUser = await userController.signup(transferToEmail, uuidv1());
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
}

module.exports = TicketApi;
