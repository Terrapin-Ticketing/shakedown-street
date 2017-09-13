const restify = require('restify');
const corsMiddleware = require('restify-cors-middleware');
const routes = require('./routes');
const mongoose = require('mongoose');
const bluebird = require('bluebird');

let server = restify.createServer({
  name: 'shakedown',
  version: '1.0.0'
});

mongoose.connect('mongodb://localhost/terrapin', { useMongoClient: true, promiseLibrary: bluebird });

const cors = corsMiddleware({
  origins: ['http://localhost:3000'],
  allowHeaders: ['*']
  // exposeHeaders: ['API-Token-Expiry']
});

server.pre(cors.preflight);
server.use(cors.actual);

server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());

routes(server); // initialize routes

server.listen(8080, () => {
  console.log('%s listening at %s', server.name, server.url);
});
