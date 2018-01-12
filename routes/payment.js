import Payment from '../controllers/payment';
let paymentController = new Payment();

import User from '../controllers/user';
let userController = new User();

import EventApi from '../controllers/user';
let eventController = new EventApi();

const TicketApi = require('../controllers/ticket');
let ticketController = new TicketApi();

module.exports = (server) => {
  // server.post('/payment', async(req, res) => {
  //   if (!req.user) return res.sendStatus(401);
  //   // let { token, fees, qty, eventAddress } = req.body;
  //   let { token: stripeToken, eventId } = req.body;
  //   let parsedToken = stripeToken.token;
  //
  //   let user = req.user;
  //   let total = 5000;
  //   try {
  //     let charge = await paymentController.createCharge(user, parsedToken, total);
  //     if (charge === 'success') {
  //       // set tickets to buyer
  //       // printTicket(callerId, eventId, ticket, ownerId)
  //       let ticket = {};
  //       await eventController.printTicket(user._id, eventId, ticket, user._id);
  //     }
  //     res.send(charge);
  //   } catch (e) {
  //     console.error(e);
  //     res.sendStatus(500);
  //   }
  // });

  server.post('/payment/:ticketId', async(req, res) => {
    let { ticketId } = req.params;
    let { token: stripeToken } = req.body;
    let passwordChangeUrl;

    let user = req.user;

    if (!user) {
      user = await userController.getUserByEmail(stripeToken.email);
      if (user) return res.send({ error: 'Email already in use. Please log in' });
      user = await userController.createPlaceholderUser(stripeToken.email);
      passwordChangeUrl = await userController.requestPasswordChange(stripeToken.email);
    }

    try {
      let ticket = await ticketController.getTicketById(ticketId);
      if (!ticket || !ticket.isForSale) {
        return res.send({ error: 'No ticket found' });
      }
      let serviceFee = 100;
      let cardFee = 100;
      let total = ticket.price + serviceFee + cardFee;
      console.log('Service Fee:', serviceFee);
      console.log('Card Fee:', cardFee);
      console.log('Total: ', total);
      let charge = await paymentController.createCharge(user, stripeToken, total);
      // TODO: I think this is wrong...charge returns a charge
      // if (charge !== 'success') return res.send({ error: 'Failed to charge card' });
      if (!charge.status === 'succeeded') return res.send({ error: 'Failed to charge card' });

      // notify us that we need to venmo
      let originalOwner = await userController.getUserById(ticket.ownerId);
      let newTicket = await ticketController.transferTicket(ticket._id, user.email, originalOwner);

      // don't use 'await' here because we want to return immediatly
      userController.sendSoldTicketEmail(originalOwner, newTicket);

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
