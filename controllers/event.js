const EventModel = require('../models/event');

class EventApi {
  async getEventInfo(eventAddress) {
    // await EventModel.findOne({eventAddress: eventAddress}).exec((err, event) => {
    //   if (!event) return reject(new Error('This event doesn\'t exist.'));
    //   return resolve(event);
    // });
    // return await new Promise((resolve, reject) => {
    // });
  }

  async createEvent(event) {
    return await EventModel.create(event);
  }
}

module.exports = EventApi;
