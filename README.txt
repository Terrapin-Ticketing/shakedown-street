db.getCollection('events').insert({
  date: '3/4/2018',
  name: 'Moograss festival for cows',
  urlSafe: 'MooGrass',
  description: 'Since 1997982 B.C. Moograss has been the number one grass destination for cattle around the world. Calfs are welcome but must be at least 10 weeks old. Moograss hosts several chicken promotion workshops.',
  venue: {
    name: 'Legend Valley',
    address: '999 Fun Time',
    city: 'Theland',
    state: 'OH',
    zip: 43215
  },
  imageUrl: 'http://liveatthebluestone.com/wp-content/uploads/2017/12/24068068_528690924147257_2284411860158418511_n.png',
  isThirdParty: true,
  eventManager: 'CINCI_TICKET',
  domain: 'https://terrapin.cincyregister.com',
  externalEventId: 102179,
  issueTicketRoute: '/testfest',
  promoCode: 'TERRAPIN',
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
