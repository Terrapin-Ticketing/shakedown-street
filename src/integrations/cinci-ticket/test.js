const { mongoose } = require('../../_utils/bootstrap')

import Event from '../../events/controller'

import CinciTicketIntegration from './integration'
import cinciTicketTestEvent from './test-event'

describe('Cinci Ticket Intergration', () => {
  beforeAll(async() => {
    await mongoose.dropCollection('events')
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
    const barcode = '0000001860012019400002'
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


  it('should return false for invalid barcode', async() => {
    const barcode = 'not-a-barcode'
    const event = await Event.createEvent(cinciTicketTestEvent)
    const isValidTicket = await CinciTicketIntegration.isValidTicket(barcode, event)
    expect(isValidTicket).toBeFalsy()
  }, 10000)

  it.only('should issue ticket', async() => {
    const event = await Event.createEvent(cinciTicketTestEvent)
    const barcode = await CinciTicketIntegration.issueTicket(event)
    const isValidTicket = await CinciTicketIntegration.isValidTicket(barcode, event)
    expect(isValidTicket).toBeTruthy()
  }, 100000)

  it('should issue get ticket type and price from barcode', async() => {
    const barcode = '0000001860012019400002'
    const event = await Event.createEvent(cinciTicketTestEvent)
    const ticketInfo = await CinciTicketIntegration.getTicketInfo(barcode, event)
    console.log('ticketInfo', ticketInfo)
    expect(ticketInfo).toBeTruthy()
  }, 100000)
})
