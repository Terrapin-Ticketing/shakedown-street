const { mongoose } = require('../../_utils/bootstrap')

import Event from '../../events/controller'
import User from '../../users/controller'

import CinciTicketIntegration from './integration'
import cinciTicketTestEvent from './test-event'

describe.skip('Cinci Ticket Intergration', () => {
  beforeAll(async() => {
    await mongoose.dropCollection('events')
    await mongoose.dropCollection('users')
    await mongoose.dropCollection('tickets')
  })
  afterEach(async() => {
    await mongoose.dropCollection('events')
    await mongoose.dropCollection('users')
    await mongoose.dropCollection('tickets')
  })

  it('should login', async() => {
    const username = process.env.CINCI_TICKET_USERNAME
    const password = process.env.CINCI_TICKET_PASSWORD
    const event = await Event.createEvent(cinciTicketTestEvent)
    const rawCookies = await CinciTicketIntegration.login(username, password, event)
    expect(rawCookies.includes('UserSession')).toBeTruthy()
  }, 10000)

  it('should return true for valid barcode', async() => {
    const barcode = '0222226482260290522229'
    const event = await Event.createEvent(cinciTicketTestEvent)
    const isValidTicket = await CinciTicketIntegration.isValidTicket(barcode, event)
    expect(isValidTicket).toBeTruthy()
  }, 10000)

  it('should return false for invalid barcode', async() => {
    const barcode = 'not-a-barcode'
    const event = await Event.createEvent(cinciTicketTestEvent)
    const isValidTicket = await CinciTicketIntegration.isValidTicket(barcode, event)
    expect(isValidTicket).toBeFalsy()
  }, 10000)

  it('should issue ticket', async() => {
    const event = await Event.createEvent(cinciTicketTestEvent)
    const user = await User.createUser('test@test.com', 'test')
    const barcode = await CinciTicketIntegration.issueTicket(event, user, 'REG')
    const isValidTicket = await CinciTicketIntegration.isValidTicket(barcode, event)
    expect(isValidTicket).toBeTruthy()
  }, 100000)

  it('should lookup ticket type and price from barcode', async() => {
    const barcode = '0000001860012019400002'
    const event = await Event.createEvent(cinciTicketTestEvent)
    const ticketInfo = await CinciTicketIntegration.getTicketInfo(barcode, event)
    expect(ticketInfo).toBeTruthy()
  }, 100000)

  it('should deactivate a barcode', async() => {
    const event = await Event.createEvent(cinciTicketTestEvent)
    const user = await User.createUser('test@test.com', 'test')
    const barcode = await CinciTicketIntegration.issueTicket(event, user, 'REG')
    const deactivatedSuccess = await CinciTicketIntegration.deactivateTicket(event._id, barcode)
    expect(deactivatedSuccess).toBeTruthy()
  }, 100000)
})
