require('../../_utils/bootstrap')

export default {
  integrationType: 'MissionTix',

  domain: process.env.MISSION_TIX_DOMAIN,
  externalEventId: 5383, // integration id
  promoCode: 'terrapin1',

  username: 'domefest',
  password: 'dometix17',

  auth: {
    apiKey: process.env.MISSION_TIX_API_KEY,
    authKey: process.env.MISSION_TIX_AUTH_KEY,
    userId: process.env.MISSION_TIX_USER_ID,
    apiKeyName: 'dome-key',
    loginUrl: process.env.MISSION_TIX_LOGIN_URL
  },


  urlSafe: 'TestMissionTix',

  date: '2018-05-17',
  name: 'Mission Tix Test Event',
  description: 'testing terrapin ticketing domefest resale',
  venue: {
    name: 'Legend Valley',
    address: '999 Fun Time',
    city: 'Theland',
    state: 'OH',
    zip: 43215
  },
  imageUrl: 'http://liveatthebluestone.com/wp-content/uploads/2017/12/24068068_528690924147257_2284411860158418511_n.png', //brewgrass
  thumbnail_image_url: 'https://scontent.fluk1-1.fna.fbcdn.net/v/t1.0-9/24177011_1547905021954884_5574619907091705671_n.jpg?oh=1480971f3c87383c4aebe2241f254fd3&oe=5AF3C3F9',


  totalMarkupPercent: 0.00,
  ticketTypes: {
    'VIP 2-Day Pass': {
      paramName: 'vip_2day',
      price: 1000
    },
    'VIP Single Day 12/1': {
      paramName: 'vip_single_day_121',
      price: 0
    },
    'VIP Single Day 12/2': {
      paramName: 'vip_single_day_122',
      price: 0
    },
    'General Admission Two-Day Pass': {
      paramName: 'general_admission',
      price: 0
    },
    'General Admission Single Day 12/1': {
      paramName: 'gen_121',
      price: 0
    },
    'General Admission Single Day 12/2': {
      paramName: 'gen_122',
      price: 0
    }
  }
}
