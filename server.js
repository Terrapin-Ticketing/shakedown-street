var restify = require('restify');
var corsMiddleware = require('restify-cors-middleware');
var errors = require('restify-errors');
var pasync = require('pasync');
var mongoose = require('mongoose');
var bluebird = require('bluebird');

const server = restify.createServer({
  name: 'myapp',
  version: '1.0.0'
});

var config = require('./config/default');
var User = require('./controllers/user');

var user = new User();

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


server.post('/login', (req, res, next) => {
  const { email, password } = req.body;
  user.getUser(email, password)
    .then((userAccount) => {
      res.send(userAccount);
      return next();
    })
    .catch((err) => {
      res.send(err);
      return next();
    });
});

server.post('/register', (req, res, next) => {
  const { email, password } = req.body;
  return user.register(email, password)
    .then((userAccount) =>{
      res.send(userAccount);
      return next();
    })
    .catch((err) => {
      res.send(err);
      return next();
    });
});

server.listen(8080, () => {
  console.log('%s listening at %s', server.name, server.url);
});
