const { mongoose } = require('../src/_utils/bootstrap')
import Event from '../src/events/controller'
import User from '../src/users/controller'
import cinciRegisterTestEvent from '../src/integrations/cinci-register/test-event'
import CinciRegister from '../src/integrations/cinci-register/integration'

import missionTixTestEvent from '../src/integrations/mission-tix/test-event'
import MissinTix from '../src/integrations/mission-tix/integration'

(async function() {
  await clearDb()
  const cinciRegisterBarcode = await createCinciReigsterTicket()
  const user = await User.createUser('reeder@terrapinticketing.com', 'test')
  process.exit()
})()

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
