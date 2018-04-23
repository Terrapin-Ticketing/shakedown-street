import EventModel from './model'

class EventController {
  async createEvent(event) {
    const savedEvent = await EventModel.create(event)
    return savedEvent
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

  async findOne(query) {
    const event = await EventModel.findOne(query)
    return event
  }

  async find(query) {
    const events = await EventModel.find(query)
    return events
  }

  async findEventById(eventId) {
    const event = await EventModel.findOne({ _id: eventId })
    return event
  }
}

export default new EventController()
