import Payment from '../controllers/payment';
let paymentController = new Payment();

import EventApi from '../controllers/user';
let eventController = new EventApi();

const TicketApi = require('../controllers/ticket');
let ticketController = new TicketApi();

module.exports = (server) => {
  server.post('/payment', async(req, res) => {
    if (!req.user) return res.sendStatus(401);
    // let { token, fees, qty, eventAddress } = req.body;
    let { token: stripeToken, eventId } = req.body;
    let parsedToken = stripeToken.token;

    let user = req.user;
    let total = 5000;
    try {
      let charge = await paymentController.createCharge(user, parsedToken, total);
      if (charge === 'success') {
        // set tickets to buyer
        // printTicket(callerId, eventId, ticket, ownerId)
        let ticket = {};
        await eventController.printTicket(user._id, eventId, ticket, user._id);
      }
      res.send(charge);
    } catch (e) {
      console.error(e);
      res.sendStatus(500);
    }
  });

  server.post('/payment/:ticketId', async(req, res) => {
    if (!req.user) return res.sendStatus(401);
    let { ticketId } = req.params;
    let { token: stripeToken } = req.body;
    let parsedToken = stripeToken.token;

    let user = req.user;
    try {
      let ticket = await ticketController.getTicketById(ticketId);
      if (!ticket.isForSale) return res.send({ error: 'Ticket Not for sale' });

      let charge = await paymentController.createCharge(user, parsedToken, ticket.price);
      if (charge !== 'success') return res.send({ error: 'Failed to charge card' });

      let purchasedTicket = await ticketController.setTicketOwner(ticketId, user);
      return res.send({ charge, ticket: purchasedTicket });
    } catch (e) {
      console.error(e);
      res.sendStatus(500);
    }
  });
};
