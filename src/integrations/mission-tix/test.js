const { mongoose } = require('../../_utils/bootstrap')

import Event from '../../events/controller'
import Ticket from '../../tickets/controller'
import User from '../../users/controller'

import MissionTix from './integration'
import missionTixTestEvent from './test-event'

describe.skip('Mission Tix Ticket Intergration', () => {
  beforeAll(async() => {
    await mongoose.dropCollection('events')
  })
  afterEach(async() => {
    await mongoose.dropCollection('events')
    await mongoose.dropCollection('users')
    await mongoose.dropCollection('tickets')
  })

  it('should log in', async() => {
    const event = await Event.createEvent(missionTixTestEvent)
    const authHeaders = await MissionTix.login(event._id)
    expect(authHeaders['dome-key']).toBeDefined()
    expect(authHeaders['auth-key']).toBeDefined()
  }, 10000)

  it('should reject invalid barcode', async() => {
    const event = await Event.createEvent(missionTixTestEvent)
    const isValid = await MissionTix.isValidTicket('not-a-barcode', event)
    expect(isValid).toBeFalsy()
  })

  it('should reject already scanned barcode', async() => {
    const event = await Event.createEvent(missionTixTestEvent)
    const isValid = await MissionTix.isValidTicket('TAM1PCT1TD', event)
    expect(isValid).toBe(false)
  })

  it('should get event info', async() => {
    const event = await Event.createEvent(missionTixTestEvent)
    const eventInfo = await MissionTix.getEventInfo(event._id)
    expect(eventInfo).toHaveProperty('user_id', event.auth.userId)
  })

  it('should issue a new ticket', async() => {
    const event = await Event.createEvent(missionTixTestEvent)
    const user = await User.createUser('test@test.com', 'test')
    const barcode = await MissionTix.issueTicket(event, user)
    expect(barcode).toBeDefined()
  }, 35000)

  it('should transfer ticket', async() => {
    const event = await Event.createEvent(missionTixTestEvent)

    const fromUser = await User.createUser(`fromUser${Math.random()}@test.com`, 'test')
    const toUser = await User.createUser(`toUser${Math.random()}@test.com`, 'test')

    const barcode = await MissionTix.issueTicket(event, fromUser)
    let price = 1000
    const ticket = await Ticket.createTicket(event._id, fromUser._id, barcode, price, 'GA')
    const newTicket = await MissionTix.transferTicket(ticket, toUser)
    expect(newTicket).toHaveProperty('ownerId', toUser._id)
  }, 35000)
})
