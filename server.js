const express = require('express');
const routes = require('./routes');
const mongoose = require('mongoose');
const bluebird = require('bluebird');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const config = require('config');
const session = require('cookie-session');

let app = express();

app.use(helmet());
// app.use(session({
//   name: config.session.name,
//   keys: [ 'test' ],
//   cookie: {
//     secure: true,
//     httpOnly: true
//   }
// }));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({limit: '3mb'}));
app.use(cookieParser());

app.use((req, res, next) => {
  res.header('X-Frame-Options', 'SAMEORIGIN');
  res.header('Access-Control-Allow-Origin', config.clientDomain);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT');
  res.header('Access-Control-Allow-Headers', 'Authorization, Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers');
  next();
});

app.set('trust proxy', 1); // trust first proxy (NGINX)

mongoose.connect('mongodb://localhost/terrapin', { useMongoClient: true, promiseLibrary: bluebird });

app.use((req, res, next) => {
  // if the user sends us a webtoken, decode it
  if (req.cookies && req.cookies.cookieToken) {
    jwt.verify(req.cookies.cookieToken, config.user.secret, (err, decoded) => {
      if (!err) req.user = decoded;
      return next();
    });
  } else {
    next();
  }
});

routes(app); // initialize routes

app.listen(config.port, () => {
  console.log('%s listening at %s', 'Shakedown Street', config.port);
});
