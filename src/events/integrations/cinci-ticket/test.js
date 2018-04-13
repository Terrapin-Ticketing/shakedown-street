const { mongoose } = require('../../../_utils/bootstrap')

import CinciTicketIntegration from './integration'

describe('Cinci Register Intergration', () => {
  beforeAll(async() => {
    await mongoose.dropCollection('events')
  })
  afterEach(async() => {
    await mongoose.dropCollection('events')
    await mongoose.dropCollection('users')
    await mongoose.dropCollection('tickets')
  })

  it.skip('should login', async() => {
    const username = process.env.CINCI_TICKET_TEST_USERNAME
    const password = process.env.CINCI_TICKET_TEST_PASSWORD
    await CinciTicketIntegration.login(username, password)
  })

})
