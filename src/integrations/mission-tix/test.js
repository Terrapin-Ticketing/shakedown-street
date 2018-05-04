const { mongoose } = require('../../_utils/bootstrap')

import MissionTix from './integration'

describe('Mission Tix Ticket Intergration', () => {
  beforeAll(async() => {
    await mongoose.dropCollection('events')
  })
  afterEach(async() => {
    await mongoose.dropCollection('events')
    await mongoose.dropCollection('users')
    await mongoose.dropCollection('tickets')
  })
  it('should', () => {
    console.log('here:')
  })

  // it('should login', async() => {
  //   const res = await MissionTix.issueTicket()
  //   console.log('res:', res)
  //   // expect(res).toHaveProperty('UserSession')
  // })
})
