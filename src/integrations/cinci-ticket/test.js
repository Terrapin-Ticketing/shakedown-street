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
    const rawCookies = await CinciTicketIntegration.login(username, password)
    expect(rawCookies.includes('UserSession')).toBeTruthy()
  })

  it('should return true for valid barcode', async() => {
    const barcode = '0000001860012019400002'
    const event = await Event.createEvent(cinciTicketTestEvent)
    const isValidTicket = await CinciTicketIntegration.isValidTicket(barcode, event)
    expect(isValidTicket).toBeTruthy()
  })

  it('should return false for invalid barcode', async() => {
    const barcode = 'not-a-barcode'
    const event = await Event.createEvent(cinciTicketTestEvent)
    const isValidTicket = await CinciTicketIntegration.isValidTicket(barcode, event)
    console.log('isValidTicket', isValidTicket)
    expect(isValidTicket).toBeFalsy()
  })

})
