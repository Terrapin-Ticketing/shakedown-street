const { mongoose } = require('../src/_utils/bootstrap')
import Event from '../src/events/controller'
import User from '../src/users/controller'
import cinciRegisterTestEvent from '../src/integrations/cinci-register/test-event'
import CinciRegisterIntegration from '../src/integrations/cinci-register/integration'

(async function() {
  await clearDb()

  const barcode = await createCinciReigsterTicket()
  console.log('Barcode: ', barcode)
  process.exit()
})()

async function createCinciReigsterTicket() {
  const user = await User.createUser('test@test.com', 'test')
  const event = await Event.createEvent(cinciRegisterTestEvent)
  const ticketType = Object.keys(event.ticketTypes)[0]
  const cinciRegisterBarcode = await CinciRegisterIntegration.issueTicket(event, user, ticketType)
  // drop database
  await mongoose.dropCollection('users')
  await mongoose.dropCollection('tickets')
  return cinciRegisterBarcode
}

async function clearDb() {
  await mongoose.dropCollection('events')
  await mongoose.dropCollection('users')
  await mongoose.dropCollection('tickets')
}
