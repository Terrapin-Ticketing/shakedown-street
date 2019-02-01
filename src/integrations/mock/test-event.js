require('../../_utils/bootstrap')

export default {
  domain: process.env.CINCI_REGISTER_DOMAIN,
  issueTicketRoute: '/testfest',
  loginUrl: process.env.CINCI_REGISTER_LOGIN_URL,

  integrationType: 'Mock',
  urlSafe: 'MockEvent',
  username: process.env.CINCI_REGISTER_USERNAME,
  password: process.env.CINCI_REGISTER_PASSWORD,

  auth: {
    billingNum: '_billing_3653461',
    billingMethod: 10292,
    rVal: 'r3653466'
  },

  date: 'do I even do anything?',
  startDate: '2018-03-04T01:00:00',
  endDate: '2019-03-06T01:00:00',
  timezone: 'EST',

  name: 'Mock event',
  description: 'an event used for testing',
  venue: {
    name: 'Legend Valley',
    address: '999 Fun Time',
    city: 'Theland',
    state: 'OH',
    zip: 43215
  },
  // imageUrl: 'https://images.parents.mdpcdn.com/sites/parents.com/files/styles/scale_1500_1500/public/images/wordpress/661/shutterstock_130073408-300x300.jpg',
  imageUrl: 'http://liveatthebluestone.com/wp-content/uploads/2017/12/24068068_528690924147257_2284411860158418511_n.png', //brewgrass
  thumbnail_image_url: 'https://scontent.fluk1-1.fna.fbcdn.net/v/t1.0-9/24177011_1547905021954884_5574619907091705671_n.jpg?oh=1480971f3c87383c4aebe2241f254fd3&oe=5AF3C3F9',

  externalEventId: 0, // integration id
  promoCode: 'MOCK_CODE',
  totalMarkupPercent: 0.00,
  totalStaticMarkup: 1600,
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
