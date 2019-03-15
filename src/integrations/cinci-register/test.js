const { mongoose } = require('../../_utils/bootstrap')

import CinciRegisterIntegration from './integration'
import Event from '../../events/controller'
import Ticket from '../../tickets/controller'
import User from '../../users/controller'

import cinciRegisterTestEvent from './test-event'

describe.skip('Cinci Register Intergration', () => {
  beforeAll(async() => {
    await mongoose.dropCollection('events')
  })
  afterEach(async() => {
    await mongoose.dropCollection('events')
    await mongoose.dropCollection('users')
    await mongoose.dropCollection('tickets')
  })
  it('should login', async() => {
    const username = process.env.CINCI_REGISTER_USERNAME
    const password = process.env.CINCI_REGISTER_PASSWORD
    const event = await Event.createEvent(cinciRegisterTestEvent)
    const sessionId = await CinciRegisterIntegration.login(username, password, event)
    expect(sessionId).toBeTruthy()
    expect(sessionId.length).toEqual(32)
  })
  it('should issueTicket', async() => {
    const user = await User.createUser('test@test.com', 'test')
    const event = await Event.createEvent(cinciRegisterTestEvent)
    const ticketType = Object.keys(event.ticketTypes)[0]
    const cinciRegisterBarcode = await CinciRegisterIntegration.issueTicket(event, user, ticketType)
    expect(cinciRegisterBarcode).toBeTruthy()
    expect(cinciRegisterBarcode.length).toEqual(16)
  })
  it('should deactivateTicket', async() => {
    const user = await User.createUser('test@test.com', 'test')
    const event = await Event.createEvent(cinciRegisterTestEvent)
    const ticketType = Object.keys(event.ticketTypes)[0]
    const cinciRegisterBarcode = await CinciRegisterIntegration.issueTicket(event, user, ticketType)

    const isDeactivated = await CinciRegisterIntegration.deactivateTicket(event._id, cinciRegisterBarcode)
    expect(isDeactivated).toBeTruthy()
  }, 20000)
  it('should transferTicket', async() => {
    const event = await Event.createEvent(cinciRegisterTestEvent)

    const fromUser = await User.createUser('fromUser@test.com', 'test')
    const toUser = await User.createUser('toUser@test.com', 'test')

    const ticketType = Object.keys(event.ticketTypes)[0]
    const cinciRegisterBarcode = await CinciRegisterIntegration.issueTicket(event, fromUser, ticketType)
    let price = 1000
    const ticket = await Ticket.createTicket(event._id, fromUser._id, cinciRegisterBarcode, price, ticketType)
    const newTicket = await CinciRegisterIntegration.transferTicket(ticket, toUser)
    expect(newTicket).toHaveProperty('ownerId', toUser._id)
  }, 20000)
  // it('should test isValidTicket', () => {
  //
  // })
})
