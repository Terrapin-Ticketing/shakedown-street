var restify = require('restify');
var corsMiddleware = require('restify-cors-middleware');
var errors = require('restify-errors');
var pasync = require('pasync');
var mongoose = require('mongoose');
var bluebird = require('bluebird');
var jwt = require('jsonwebtoken');


const server = restify.createServer({
  name: 'myapp',
  version: '1.0.0'
});

var config = require('./config/default');
var User = require('./controllers/user');
let { secret } = config.user;

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
    .then((user) => {
      let { email, walletAddress, privateKey } = user;
      let token = jwt.sign({ email, walletAddress, privateKey }, secret);
      let expire = 1000 * 60 * 60 * 24 * 2;
      res.status(200)
        .cookie('cookieToken', token, { maxAge: expire })
        .json({ token });
      return next();
    })
    .catch((err) => {
      console.log('getUser err: ', err);
      res.send(err);
      return next();
    });
});

server.post('/register', (req, res, next) => {
  const { email, password } = req.body;
  return user.register(email, password)
    .then((user) => {
      let { email, walletAddress, privateKey } = user;
      let token = jwt.sign({ email, walletAddress, privateKey }, secret);
      let expire = 1000 * 60 * 60 * 24 * 2;
      res.status(200)
        .cookie('cookieToken', token, { maxAge: expire })
        .json({ token });
      return next();
    })
    .catch((err) => {
      console.log('register err: ', err);
      res.send(err);
      return next();
    });
});

server.listen(8080, () => {
  console.log('%s listening at %s', server.name, server.url);
});
