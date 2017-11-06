const config = require('config');

const EventModel = require('../models/event');

class EventApi {
  getEventInfo(eventAddress) {
    console.log('hits33');
    return new Promise((resolve, reject) => {
      console.log('hits44, ', eventAddress);
      EventModel.findOne({eventAddress: eventAddress}).exec((err, event) => {
        console.log('hits55: ', event);
        if (!event) return reject(new Error('This event doesn\'t exist.'));
        console.log('resolve');
        return resolve(event);
      });
    });
  }
}

module.exports = EventApi;
