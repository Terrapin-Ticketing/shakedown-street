const express = require('express');
const routes = require('./routes');
const mongoose = require('mongoose');
const bluebird = require('bluebird');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const config = require('config');

let app = express();

app.use(helmet());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({limit: '3mb'}));
app.use(cookieParser());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', config.allowOrigin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT');
  res.header('Access-Control-Allow-Headers', 'Authorization, Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers');
  next();
});

// app.use(function(err, req, res, next) {
//   if (err.name === 'UnauthorizedError') {
//     res.status(401).send('invalid token...');
//   } else {
//     // next();
//   }
// });

mongoose.connect('mongodb://localhost/terrapin', { useMongoClient: true, promiseLibrary: bluebird });

routes(app); // initialize routes

app.listen(config.port, () => {
  console.log('%s listening at %s', 'Shakedown Street', config.port);
});
