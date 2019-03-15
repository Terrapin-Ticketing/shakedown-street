const { mongoose } = require('../../_utils/bootstrap')

import Event from '../../events/controller'
import User from '../../users/controller'

import EventBriteIntegration from './integration'
import testEventConfig from './test-event'

describe('Cinci Ticket Intergration', () => {
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
    const event = await Event.createEvent(testEventConfig)
    const rawCookies = await EventBriteIntegration.login(apiKey, '', event)
    // expect(rawCookies.includes('UserSession')).toBeTruthy()
  }, 10000)

  it.only('should return true for valid orderNumber', async() => {
    const event = await Event.createEvent(testEventConfig)
    const orderNumber = '916100082'
    const orders = await EventBriteIntegration.getTicketsByOrderId(orderNumber, event)
    console.log('orders', JSON.stringify(orders.attendees, null, '  '))
    // expect(isValidTicket).toBeTruthy()
  }, 10000)

  // it('should return true for valid barcode', async() => {
  //   const barcode = 'not-a-barcode'
  //   const event = await Event.createEvent(cinciTicketTestEvent)
  //   const isValidTicket = await CinciTicketIntegration.isValidTicket(barcode, event)
  //   expect(isValidTicket).toBeFalsy()
  // }, 10000)
  // it('should return false for invalid barcode', async() => {
  //   const barcode = 'not-a-barcode'
  //   const event = await Event.createEvent(cinciTicketTestEvent)
  //   const isValidTicket = await CinciTicketIntegration.isValidTicket(barcode, event)
  //   expect(isValidTicket).toBeFalsy()
  // }, 10000)
  //
  // it('should issue ticket', async() => {
  //   const event = await Event.createEvent(cinciTicketTestEvent)
  //   const user = await User.createUser('test@test.com', 'test')
  //   const barcode = await CinciTicketIntegration.issueTicket(event, user, 'REG')
  //   const isValidTicket = await CinciTicketIntegration.isValidTicket(barcode, event)
  //   expect(isValidTicket).toBeTruthy()
  // }, 100000)
  //
  // it('should lookup ticket type and price from barcode', async() => {
  //   const barcode = '0000001860012019400002'
  //   const event = await Event.createEvent(cinciTicketTestEvent)
  //   const ticketInfo = await CinciTicketIntegration.getTicketInfo(barcode, event)
  //   expect(ticketInfo).toBeTruthy()
  // }, 100000)
  //
  // it('should deactivate a barcode', async() => {
  //   const event = await Event.createEvent(cinciTicketTestEvent)
  //   const user = await User.createUser('test@test.com', 'test')
  //   const barcode = await CinciTicketIntegration.issueTicket(event, user, 'REG')
  //   const deactivatedSuccess = await CinciTicketIntegration.deactivateTicket(event._id, barcode)
  //   expect(deactivatedSuccess).toBeTruthy()
  // }, 100000)
})
