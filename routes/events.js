const EventApi = require('../controllers/event');
let eventController = new EventApi();

module.exports = (server) => {
  server.get('/event/:id', async(req, res) => {
    let { id } = req.params;
    try {
      let event = await eventController.getEventInfo(id);
      res.send({ event });
    } catch (e) {
      res.sendStatus(500);
    }
  });

  server.post('/events', async(req, res) => {
    if (!req.user) return res.send(401);
    let { event } = req.body;
    await eventController.createEvent(event);
    res.send(200);
  });
};
