db.getCollection('events').insert({
  date: '3/4/2018',
  name: `Moograss festival for cows`,
  urlSafe: `Moograss`,
  description: 'Since 1997982 B.C. Moograss has been the number one grass destination for cattle around the world. Calfs are welcome but must be at least 10 weeks old. Moograss hosts several chicken promotion workshops.',
  venue: {
    name: 'Moograss farms',
    address: '583 E Broad St',
    city: 'Columbus',
    state: 'OH',
    zip: 43215
  },
  imageUrl: 'https://terrapinticketing.com/img/phish1.png',
  isThirdParty: true,
  eventManager: 'CINCI_TICKET',
  externalEventId: 102179
});
