import Payment from '../controllers/payment';
let paymentController = new Payment();

import User from '../controllers/user';
let userController = new User();

import EventApi from '../controllers/event';
let eventController = new EventApi();

const TicketApi = require('../controllers/ticket');
let ticketController = new TicketApi();

module.exports = (server) => {
  server.post('/payment/:ticketId', async(req, res) => {
    let { ticketId } = req.params;
    let { token: stripeToken, transferToUser } = req.body;
    let passwordChangeUrl;

    let user = req.user;
    if (!user) {
      user = await userController.getUserByEmail(transferToUser.email);
      if (user) return res.send({ error: 'There is already an account with this email addres. Please log in to purchase this ticket.' });
      user = await userController.createPlaceholderUser(transferToUser.email);
      passwordChangeUrl = await userController.requestPasswordChange(transferToUser.email, false);
    }

    try {
      let ticket = await ticketController.getTicketById(ticketId);
      if (!ticket || !ticket.isForSale) {
        return res.send({ error: 'No ticket found' });
      }
      let event = await eventController.getEventById(ticket.eventId);

      let serviceFee = ticket.price * event.totalMarkupPercent;
      let baseTotal = serviceFee + ticket.price;

      let stripeTotal = (baseTotal * 0.029) + 30;

      let total = Math.ceil(baseTotal + stripeTotal);
      console.log('TOTAL:', total);
      let charge;
      try {
        charge = await paymentController.createCharge(user, stripeToken, total);
      } catch (e) {
        console.log('charge failed:', e);
        return res.send({ error: 'Failed to charge card' });
      }

      // console.log('charge:', charge);
      // // if (charge !== 'success') return res.send({ error: 'Failed to charge card' });
      // if (!charge.status === 'succeeded') return res.send({ error: 'Failed to charge card' });

      // notify us that we need to venmo
      let originalOwner = await userController.getUserById(ticket.ownerId);
      let newTicket = await ticketController.transferPurchasedTicket(ticket._id, transferToUser, originalOwner);
      // don't use 'await' here because we want to return immediately
      userController.sendSoldTicketEmail(originalOwner, newTicket);
      userController.sendInternalPaymentNotificationEmail(originalOwner, user, newTicket);

      /*
      // send notification to kevin or I that someone bought a ticket
      this.sendNotification(to, ticket.price, serviceFee, cardFee);
      hey kev,

      ${user.email} has bought ticket ${ticket._id} from ${ticket.originalOwner}

      Ticket Price: ${ticket.price}

      ${ticket.originalOwner} would like to be paid using:

      ${ticket.originalOwner.payment.default} with ${ticket.originalOwner.payment[default]}
      // i.e: venmo with 513-623-8888
      */

      return res.send({
        charge,
        ticket: newTicket,
        passwordChangeUrl
      });
    } catch (e) {
      console.error(e);
      res.sendStatus(500);
    }
  });
};
