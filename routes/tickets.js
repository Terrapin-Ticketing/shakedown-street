const EventApi = require('../controllers/event');
let eventController = new EventApi();

const TicketApi = require('../controllers/ticket');
let ticketController = new TicketApi();

module.exports = (server) => {
  server.get('/events/:id/tickets', async(req, res) => {
    let { id } = req.params;
    try {
      let tickets = await eventController.getTicketsByEventId(id);
      res.send({ tickets });
    } catch (e) {
      console.log('err', e);
      res.sendStatus(500);
    }
  });

  server.get('/events/:id/tickets/:ticketId', async(req, res) => {
    let { ticketId } = req.params;
    try {
      let ticket = await ticketController.getTicketById(ticketId, req.user);
      res.send({ ticket });
    } catch (e) {
      res.sendStatus(500);
    }
  });

  // print ticket
  server.post('/events/:eventId/tickets', async(req, res) => {
    if (!req.user) return res.send(401);
    let { eventId } = req.params;

    let callerIsEventOwner = await eventController.isEventOwner(req.user._id, eventId);
    if (!callerIsEventOwner) return res.send(401);

    let { ticket, ownerId } = req.body;
    try {
      let newTicket = await eventController.printTicket(req.user._id, eventId, ticket, ownerId);
      res.send({ ticket: newTicket });
    } catch (e) {
      res.sendStatus(500);
    }
  });

  server.post('/tickets/:id/transfer', async(req, res) => {
    if (!req.user) return res.send(401);
    let { id } = req.params;
    let { email } = req.body;
    try {
      let transferedTicket = await ticketController.transferTicket(id, email, req.user);
      if (!transferedTicket) return res.send(403);
      res.send({ ticket: transferedTicket });
    } catch (e) {
      res.sendStatus(500);
    }
  });

  server.post('/tickets/:id/sell', async(req, res) => {
    if (!req.user) return res.send(401);
    let { id } = req.params;
    let { isForSale } = req.body;
    try {
      let ticket = await ticketController.setIsForSale(id, isForSale, req.user);
      if (!ticket) return res.send(403);
      res.send({ ticket });
    } catch (e) {
      res.sendStatus(500);
    }
  });

};
