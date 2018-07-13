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
    const res = await CinciTicketIntegration.login(username, password)
    expect(res).toHaveProperty('UserSession')
  })

  it.only('should check valdity of barcode', async() => {
    const barcode = '0000001860012019400002'
    const event = await Event.createEvent(cinciTicketTestEvent)
    const isValidTicket = await CinciTicketIntegration.isValidTicket(barcode, event)
    // const username = process.env.CINCI_TICKET_USERNAME
    // const password = process.env.CINCI_TICKET_PASSWORD
    // const res = await CinciTicketIntegration.login(username, password)
    // expect(res).toHaveProperty('UserSession')
  })
})
