const config = require('config');

const EventModel = require('../models/event');

class EventApi {
  getEventInfo(eventAddress) {
    return new Promise((resolve, reject) => {
      EventModel.findOne({eventAddress: eventAddress}).exec((err, event) => {
        if (!event) return reject(new Error('This event doesn\'t exist.'));
        return resolve(event);
      });
    });
  }
}

module.exports = EventApi;
