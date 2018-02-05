db.getCollection('events').insert({
  date: '3/2/2018',
  name: 'Columbus Brewgrass Festival',
  urlSafe: 'Brewgrass',
  description: 'Our goal is to bring you the best in Beer and Bluegrass to Columbus OH. Winter will be over and we will be ready to come out and play. See you at the Bluestone!',
  venue: {
    name: 'The Bluestone',
    address: '583 E Broad St',
    city: 'Columbus',
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
  totalMarkupPercent: 0.10,
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
})
