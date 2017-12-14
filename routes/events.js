const EventApi = require('../controllers/event');
let eventController = new EventApi();

const TicketApi = require('../controllers/ticket');
let ticketController = new TicketApi();

module.exports = (server) => {
  server.get('/events/:id', async(req, res) => {
    let { id } = req.params;
    try {
      let event = await eventController.getEventById(id);
      res.send({ event });
    } catch (e) {
      console.error(e);
      res.sendStatus(500);
    }
  });

  server.post('/events', async(req, res) => {
    let { event } = req.body;
    try {
      let newEvent = await eventController.createEvent(event, req.user._id);
      res.send(newEvent);
    } catch (e) {
      console.error(e);
      res.sendStatus(500);
    }
  });

  server.post('/events/find', async(req, res) => {
    if (!req.user) return res.sendStatus(401);
    let { query } = req.body;
    try {
      let events = await eventController.find(query);
      res.send({ events });
    } catch (e) {
      console.error(e);
      res.sendStatus(500);
    }
  });

  server.post('/events/:id/redeem', async(req, res) => {
    if (!req.user) return res.sendStatus(401);
    let { ticketId } = req.body;
    let { id } = req.params;
    // ensure use is the event owner
    try {
      let success = await ticketController.redeemTicket(id, ticketId, req.user._id);
      if (!success) return res.sendStatus(403);
      res.sendStatus(200);
    } catch (e) {
      console.error(e);
      res.sendStatus(500);
    }
  });
};
