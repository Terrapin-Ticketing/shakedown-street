const { mongoose } = require('../src/_utils/bootstrap')
import Event from '../src/events/controller'
import User from '../src/users/controller'

import cinciRegisterTestEvent from '../src/integrations/cinci-register/test-event'
import CinciRegister from '../src/integrations/cinci-register/integration'

import missionTixTestEvent from '../src/integrations/mission-tix/test-event'
import MissinTix from '../src/integrations/mission-tix/integration'

import cinciTicketTestEvent from '../src/integrations/cinci-ticket/test-event'
import CinciTicket from '../src/integrations/cinci-ticket/integration'

import mockTestEvent from '../src/integrations/mock/test-event'
import MockIntegration from '../src/integrations/mock/integration'

import eventbriteTestEvent from '../src/integrations/eventbrite/test-event'
import EventbriteIntegration from '../src/integrations/eventbrite/integration'

(async function() {
  await clearDb()
  const barcode = await createEventbriteEvent()
  console.log('eventbrite : ', barcode)
  const user = await User.createUser('michaelEventbrite@tt.com', 'test')
  console.log('created user:', user.email)
  process.exit()
})()

async function createEventbriteEvent() {
  const user = await User.createUser('kevinEventbrite@tt.com', 'test')
  const event = await Event.createEvent(eventbriteTestEvent)

  const orderId = await EventbriteIntegration.issueTicket(event, user, 'REG')
  // drop database
  await mongoose.dropCollection('tickets')
  return orderId
}

async function createMockTestEvent() {
  const user = await User.createUser('mock@tt.com', 'test')
  const event = await Event.createEvent(mockTestEvent)

  const barcode = await MockIntegration.issueTicket(event, user, 'REG')
  // drop database
  await mongoose.dropCollection('tickets')
  return barcode
}

async function createCinciTicket() {
  const user = await User.createUser('test1@test.com', 'test')
  const event = await Event.createEvent(cinciTicketTestEvent)

  console.log('event', event)

  const barcode = await CinciTicket.issueTicket(event, user, 'REG')
  // drop database
  await mongoose.dropCollection('users')
  await mongoose.dropCollection('tickets')
  return barcode
}

async function createMissionTixTicket() {
  const user = await User.createUser('test1@test.com', 'test')
  const event = await Event.createEvent(missionTixTestEvent)

  const barcode = await MissinTix.issueTicket(event, user)
  // drop database
  await mongoose.dropCollection('users')
  await mongoose.dropCollection('tickets')
  return barcode
}

async function createCinciReigsterTicket() {
  const user = await User.createUser('test@test.com', 'test')
  const event = await Event.createEvent(cinciRegisterTestEvent)
  console.log(event)
  const ticketType = Object.keys(event.ticketTypes)[0]
  const cinciRegisterBarcode = await CinciRegister.issueTicket(event, user, ticketType)
  // drop database
  await mongoose.dropCollection('users')
  await mongoose.dropCollection('tickets')
  return cinciRegisterBarcode
}

async function clearDb() {
  await mongoose.dropCollection('events')
  await mongoose.dropCollection('users')
  await mongoose.dropCollection('tickets')
  await mongoose.dropCollection('payouts')
  await mongoose.dropCollection('transfers')
}
