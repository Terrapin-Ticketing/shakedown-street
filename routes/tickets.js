const EventApi = require('../controllers/event');
let eventController = new EventApi();

const TicketApi = require('../controllers/ticket');
let ticketController = new TicketApi();

const UserApi = require('../controllers/user');
let userController = new UserApi();

module.exports = (server) => {
  server.get('/events/:id/tickets', async(req, res) => {
    let { id } = req.params;
    try {
      let tickets = await eventController.getTicketsByEventId(id);
      res.send({ tickets });
    } catch (e) {
      console.error(e);
      res.sendStatus(500);
    }
  });

  server.get('/events/:id/tickets/:ticketId', async(req, res) => {
    let { ticketId } = req.params;
    try {
      let ticket = await ticketController.getTicketById(ticketId, req.user);
      res.send({ ticket });
    } catch (e) {
      console.error(e);
      res.sendStatus(500);
    }
  });

  // print ticket
  server.post('/events/:eventId/tickets', async(req, res) => {
    if (!req.user) return res.sendStatus(401);
    let { eventId } = req.params;

    let callerIsEventOwner = await eventController.isEventOwner(req.user._id, eventId);
    if (!callerIsEventOwner) return res.sendStatus(401);

    let { ticket, ownerId } = req.body;
    try {
      let newTicket = await eventController.printTicket(req.user._id, eventId, ticket, ownerId);
      res.send({ ticket: newTicket });
    } catch (e) {
      console.error(e);
      res.sendStatus(500);
    }
  });

  server.post('/tickets/find', async(req, res) => {
    if (!req.user) return res.sendStatus(401);
    let { query } = req.body;
    try {
      let tickets = await ticketController.find(query, req.user);
      if (!tickets) return res.sendStatus(403);
      res.send({ tickets });
    } catch (e) {
      console.error(e);
      res.sendStatus(500);
    }
  });

  server.get('/tickets/:id', async(req, res) => {
    let { id } = req.params;
    try {
      let ticket = await ticketController.getTicketById(id, req.user);
      if (!ticket) return res.sendStatus(403);
      res.send({ ticket });
    } catch (e) {
      console.error(e);
      res.sendStatus(500);
    }
  });

  server.post('/tickets/:id/transfer', async(req, res) => {
    if (!req.user) return res.sendStatus(401);
    let { id } = req.params;
    let { email } = req.body;
    try {
      let transferedTicket = await ticketController.transferTicket(id, email, req.user);
      if (!transferedTicket) return res.sendStatus(403);
      res.send({ ticket: transferedTicket });
    } catch (e) {
      console.error(e);
      res.sendStatus(500);
    }
  });

  server.post('/tickets/:id/sell', async(req, res) => {
    if (!req.user) return res.sendStatus(401);
    let { id } = req.params;
    let { isForSale, price } = req.body;
    try {
      let ticket = await ticketController.setIsForSale(id, isForSale, price, req.user);
      if (!ticket) return res.sendStatus(403);
      res.send({ ticket });
    } catch (e) {
      console.error(e);
      res.sendStatus(500);
    }
  });

  // server.post('/:urlSafe/register-ticket', async(req, res) => {
  //   if (!req.user) return res.sendStatus(401);
  //   let { urlSafe } = req.params;
  //   let { ticket } = req.body;
  //
  //   try {
  //     let event = await eventController.getEventByUrlSafe(urlSafe);
  //     let registeredTicket = await ticketController.registerTicket(ticket, event._id, req.user);
  //     res.send({ registeredTicket });
  //   } catch (e) {
  //     console.error(e);
  //     res.sendStatus(500);
  //   }
  // });

  server.post('/:urlSafe/activate', async(req, res) => {
    let { urlSafe } = req.params;
    let { email, ticketNumber: barcode } = req.body;
    let passwordChangeUrl;
    try {
      let user = await userController.getUserByEmail(email);
      if (!user) {
        user = await userController.createPlaceholderUser(email);
        passwordChangeUrl = await userController.requestPasswordChange(email, false);
      }

      let ticket = await ticketController.getTicketByBarcode(barcode);
      if (ticket) return res.send({ error: 'This ticket has already been activated' });

      let event = await eventController.getEventByUrlSafe(urlSafe);
      let transferedTicket = await ticketController.activateThirdPartyTicket(event._id, barcode, user);
      if (!transferedTicket) return res.sendStatus(403);

      res.send({
        passwordChangeUrl,
        ticket: transferedTicket
      });
    } catch (e) {
      console.error(e);
      res.sendStatus(500);
    }
  });
};
