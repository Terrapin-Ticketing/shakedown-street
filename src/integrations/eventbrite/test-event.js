require('../../_utils/bootstrap')

export default {
  domain: 'https://www.eventbriteapi.com/v3/events',
  issueTicketRoute: '/testfest',
  loginUrl: process.env.CINCI_REGISTER_LOGIN_URL,

  integrationType: 'Eventbrite',
  urlSafe: 'domefest',

  username: process.env.CINCI_REGISTER_USERNAME,
  password: process.env.CINCI_REGISTER_PASSWORD,

  auth: {
    apiKey: process.env.EVENTBRITE_API_KEY
  },

  date: 'do I even do anything?',
  startDate: '2018-03-04T01:00:00',
  endDate: '2019-03-06T01:00:00',
  timezone: 'EST',

  // we should also get all this from the source
  name: 'Domefest',
  description: 'an event used for testing',
  venue: {
    name: 'Legend Valley',
    address: '999 Fun Time',
    city: 'Theland',
    state: 'OH',
    zip: 43215
  },
  // imageUrl: 'https://images.parents.mdpcdn.com/sites/parents.com/files/styles/scale_1500_1500/public/images/wordpress/661/shutterstock_130073408-300x300.jpg',
  imageUrl: 'http://domefestival.com/wp-content/uploads/2018/11/DateAnnounceNewLogo-v2transparent-800-1.png', //brewgrass
  thumbnail_image_url: 'http://domefestival.com/wp-content/uploads/2018/11/DateAnnounceNewLogo-v2transparent-800-1.png',

  externalEventId: 56017677381, // integration id
  promoCode: 'MOCK_CODE',
  totalMarkupPercent: 0.00,
  totalStaticMarkup: 1600


  // I refuse to do ticket types like this. We should always look them up from the
  // source
  //

  // ticketTypes: {
  //   'VIP 2-Day Pass': {
  //     paramName: 'vip_2day',
  //     price: 1000
  //   },
  //   'VIP Single Day 12/1': {
  //     paramName: 'vip_single_day_121',
  //     price: 0
  //   },
  //   'VIP Single Day 12/2': {
  //     paramName: 'vip_single_day_122',
  //     price: 0
  //   },
  //   'General Admission Two-Day Pass': {
  //     paramName: 'general_admission',
  //     price: 0
  //   },
  //   'General Admission Single Day 12/1': {
  //     paramName: 'gen_121',
  //     price: 0
  //   },
  //   'General Admission Single Day 12/2': {
  //     paramName: 'gen_122',
  //     price: 0
  //   }
  // }
}
