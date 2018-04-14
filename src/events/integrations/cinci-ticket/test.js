const { mongoose } = require('../../../_utils/bootstrap')

import CinciTicketIntegration from './integration'

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

})
