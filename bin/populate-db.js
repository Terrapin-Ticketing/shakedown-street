require('../src/_utils/bootstrap')
import Event from '../src/events/controller'
import cinciRegisterTestEvent from '../src/integrations/cinci-register/test-event'


(async function() {
  console.log('start create event')
  await Event.createEvent(cinciRegisterTestEvent)
  console.log('end create event')
  process.exit()
})()
