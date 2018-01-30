db.getCollection('events').insert({
  date: '3/4/2018',
  name: 'Test Fest',
  urlSafe: 'TestFest',
  description: 'Since 1997982 B.C. Moograss has been the number one grass destination for cattle around the world. Calfs are welcome but must be at least 10 weeks old. Moograss hosts several chicken promotion workshops.',
  venue: {
    name: 'Legend Valley',
    address: '999 Fun Time',
    city: 'Theland',
    state: 'OH',
    zip: 43215
  },
  imageUrl: 'http://liveatthebluestone.com/wp-content/uploads/2017/12/24068068_528690924147257_2284411860158418511_n.png',
  thumbnail_image_url: 'https://scontent.fluk1-1.fna.fbcdn.net/v/t1.0-9/24177011_1547905021954884_5574619907091705671_n.jpg?oh=1480971f3c87383c4aebe2241f254fd3&oe=5AF3C3F9',
  isThirdParty: true,
  eventManager: 'CINCI_TICKET',
  domain: 'https://terrapin.cincyregister.com',
  externalEventId: 102179,
  issueTicketRoute: '/testfest',
  promoCode: 'TERRAPIN',
  totalMarkupPercent: 0.20,
  ticketTypes: {
    'VIP 2-Day Pass': {
      paramName: 'vip_2day',
      price: 50
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
})
