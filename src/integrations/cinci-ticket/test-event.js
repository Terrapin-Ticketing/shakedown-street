require('../../_utils/bootstrap')

export default {
  // domain: process.env.CINCI_REGISTER_DOMAIN,
  // issueTicketRoute: '/testfest',
  loginUrl: process.env.CINCI_TICKET_LOGIN_URL,

  integrationType: 'CinciTicket',
  urlSafe: 'CinciTicketTestEvent',
  username: process.env.CINCI_TICKET_USERNAME,
  password: process.env.CINCI_TICKET_PASSWORD,

  auth: {
    areaId: 246,
    paymentType: 4
  },

  startDate: '2018-03-04T01:00:00',
  endDate: '2019-03-06T01:00:00',
  timezone: 'EST',

  name: 'Cinci Ticket Test Event',
  description: 'an event using cinci ticket showare backend',
  venue: {
    name: 'Legend Valley',
    address: '7585 Kindle Rd',
    city: 'Thornville',
    state: 'OH',
    zip: 43076
  },
  // imageUrl: 'https://images.parents.mdpcdn.com/sites/parents.com/files/styles/scale_1500_1500/public/images/wordpress/661/shutterstock_130073408-300x300.jpg',
  imageUrl: 'http://liveatthebluestone.com/wp-content/uploads/2017/12/24068068_528690924147257_2284411860158418511_n.png', //brewgrass
  thumbnail_image_url: 'https://scontent.fluk1-1.fna.fbcdn.net/v/t1.0-9/24177011_1547905021954884_5574619907091705671_n.jpg?oh=1480971f3c87383c4aebe2241f254fd3&oe=5AF3C3F9',

  externalEventId: 186, // integration id
  promoCode: 'TERRAPIN',
  totalMarkupPercent: 0.00,
  totalStaticMarkup: 1600,
  ticketTypes: {}
}
