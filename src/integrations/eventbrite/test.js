const { mongoose } = require('../../_utils/bootstrap')

import Event from '../../events/controller'
import User from '../../users/controller'

import EventBriteIntegration from './integration'
import eventBriteTestEventConfig from './test-event'

describe('Eventbrite Intergration', () => {
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
    const event = await Event.createEvent(eventBriteTestEventConfig)
    const apiKey = await EventBriteIntegration.login(event)
    expect(apiKey).toEqual(event.auth.apiKey)
  }, 10000)

  it('should return order by orderId', async() => {
    const event = await Event.createEvent(eventBriteTestEventConfig)
    const orderNumber = '916100082'
    const order = await EventBriteIntegration.getOrderById(orderNumber, event)
    expect(order).toBeTruthy()
    expect(order).toHaveProperty('tickets')
  }, 10000)

  it('should return true for valid barcode', async() => {
    const barcode = '9161000821147688597001'
    const event = await Event.createEvent(eventBriteTestEventConfig)
    const isValidTicket = await EventBriteIntegration.isValidTicket(barcode, event)
    expect(isValidTicket).toEqual(true)
  }, 10000)

  it('should return false for invalid barcode', async() => {
    const barcode = 'not-a-barcode'
    const event = await Event.createEvent(eventBriteTestEventConfig)
    const isValidTicket = await EventBriteIntegration.isValidTicket(barcode, event)
    expect(isValidTicket).toBeFalsy()
  }, 10000)

  it('should lookup event details from eventbrite', async() => {
    const event = await Event.createEvent(eventBriteTestEventConfig)
    const eventInfo = await EventBriteIntegration.getEventInfo(event)
    expect(eventInfo).toBeTruthy()
  }, 100000)

  it('should lookup all current ticket types from eventbrite', async() => {
    const event = await Event.createEvent(eventBriteTestEventConfig)
    const ticketTypes = await EventBriteIntegration.getTicketTypes(event)
    expect(ticketTypes[0]).toBeTruthy()
  }, 100000)

  it('should lookup ticket by barcode from private method', async() => {
    const barcode = '9161000821147688597001'
    const event = await Event.createEvent(eventBriteTestEventConfig)
    const ticket = await EventBriteIntegration.getTicketById(barcode, event)
    expect(ticket).toHaveProperty('barcodes')
  }, 100000)

  it('should lookup ticket by barcode from public method', async() => {
    const barcode = '9161000821147688597001'
    const event = await Event.createEvent(eventBriteTestEventConfig)
    const ticketInfo = await EventBriteIntegration.getTicketInfo(barcode, event)
    expect(ticketInfo).toBeTruthy()
  }, 100000)


  // PROGRAMMATIC ORDERS
  //
  // it('should issue ticket', async() => {
  //   const event = await Event.createEvent(cinciTicketTestEvent)
  //   const user = await User.createUser('test@test.com', 'test')
  //   const barcode = await CinciTicketIntegration.issueTicket(event, user, 'REG')
  //   const isValidTicket = await CinciTicketIntegration.isValidTicket(barcode, event)
  //   expect(isValidTicket).toBeTruthy()
  // }, 100000)
  //

  // REFUND
  //
  // it('should deactivate a barcode', async() => {
  //   const event = await Event.createEvent(cinciTicketTestEvent)
  //   const user = await User.createUser('test@test.com', 'test')
  //   const barcode = await CinciTicketIntegration.issueTicket(event, user, 'REG')
  //   const deactivatedSuccess = await CinciTicketIntegration.deactivateTicket(event._id, barcode)
  //   expect(deactivatedSuccess).toBeTruthy()
  // }, 100000)
})
