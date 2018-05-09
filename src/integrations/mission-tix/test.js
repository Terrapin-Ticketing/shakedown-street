const { mongoose } = require('../../_utils/bootstrap')

import Event from '../../events/controller'
// import Ticket from '../../tickets/controller'
// import User from '../../users/controller'

import MissionTix from './integration'
import missionTixTestEvent from './test-event'

describe('Mission Tix Ticket Intergration', () => {
  beforeAll(async() => {
    await mongoose.dropCollection('events')
  })
  afterEach(async() => {
    await mongoose.dropCollection('events')
    await mongoose.dropCollection('users')
    await mongoose.dropCollection('tickets')
  })

  it.only('should log in', async() => {
    const event = await Event.createEvent(missionTixTestEvent)
    const authKeys = await MissionTix.login(event._id)
    console.log('authKeys:', authKeys)
  })

  it('should reject invalid barcode', async() => {
    const event = await Event.createEvent(missionTixTestEvent)
    const isValid = await MissionTix.isValidTicket('not-a-barcode', event)
    expect(isValid).toBeFalsy()
  })

  it('should reject already scanned barcode', async() => {
    const event = await Event.createEvent(missionTixTestEvent)
    const isValid = await MissionTix.isValidTicket('TAM1PCT1TD', event)
    expect(isValid).toBeFalsy()
  })

  it('should get event info', async() => {
    const event = await Event.createEvent(missionTixTestEvent)
    const eventInfo = await MissionTix.getEventInfo(event._id)
    expect(eventInfo).toHaveProperty('user_id', event.auth.userId)
  })

})
