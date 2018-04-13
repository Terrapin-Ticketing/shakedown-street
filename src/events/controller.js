import EventModel from './model'

class EventController {
  async createEvent(event) {
    try {
      const savedEvent = await EventModel.create(event)
      return savedEvent
    } catch (e) {
      if (~e.message.indexOf('ValidationError')) return null
      throw e
    }
  }

  async getEventById(eventId) {
    let event = await EventModel.findOne({ _id: eventId })
    return event
  }

  async getEventByUrlSafe(urlSafe) {
    const event = await EventModel.findOne({ urlSafe })
    return event
  }

  async getEventInfo(eventId) {
    const event = await EventModel.findOne({ _id: eventId })
    return event
  }

  async getTicketTypes(eventId) {
    const event = await EventModel.findOne({ _id: eventId })
    return event && event.ticketTypes
  }
}

export default new EventController()
