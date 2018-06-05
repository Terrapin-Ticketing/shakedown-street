require('../../_utils/bootstrap')

export default {
  integrationType: 'MissionTix',

  domain: process.env.MISSION_TIX_DOMAIN,
  externalEventId: 5383, // integration id

  username: process.env.MISSION_TIX_USERNAME,
  password: process.env.MISSION_TIX_PASSWORD,

  auth: {
    apiKey: process.env.MISSION_TIX_API_KEY,
    userId: process.env.MISSION_TIX_USER_ID,
    apiKeyName: 'dome-key',
    loginUrl: process.env.MISSION_TIX_LOGIN_URL,
    externalTicketId: process.env.MISSION_TIX_EXTERNAL_TICKET_ID // box office ticket id
  },

  ticketRenderMethod: 'QR',

  urlSafe: 'TestMissionTix',

  date: '2018-05-17',
  startDate: '2018-05-17T01:00:00',
  endDate: '2018-05-20T01:00:00',
  timezone: 'EST',
  name: 'Mission Tix Test Event',
  description: 'testing terrapin ticketing domefest resale',
  venue: {
    name: 'Legend Valley',
    address: '999 Fun Time',
    city: 'Theland',
    state: 'OH',
    zip: 43215
  },
  imageUrl: 'https://www.mt.cm/sites/default/files/styles/event-image/public/dome.jpg?itok=TEZaI3qa', //brewgrass
  thumbnail_image_url: 'https://scontent.fluk1-1.fna.fbcdn.net/v/t1.0-9/24177011_1547905021954884_5574619907091705671_n.jpg?oh=1480971f3c87383c4aebe2241f254fd3&oe=5AF3C3F9',


  totalMarkupPercent: 0.00,
  ticketTypes: {}
}
