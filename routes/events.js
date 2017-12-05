const Event = require('../controllers/event');
let eventCol = new Event();

let requireAuth = '../utils/requireAuth';

module.exports = (server) => {
  server.get('/event/:id', async(req, res) => {
    let { id } = req.params;
    console.log('id', id);
    try {
      let event = await eventCol.getEventInfo(id);
      res.send({ event });
    } catch (e) {
      res.sendStatus(500);
    }
  });

  server.post('/events', async(req) => {
    let { event } = req.body;
    console.log(event);
  });
};
