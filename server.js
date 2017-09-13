const express = require('express');
const routes = require('./routes');
const mongoose = require('mongoose');
const bluebird = require('bluebird');
const helmet = require('helmet');
const cookieParser = require('cookieParser');
const bodyParser = 'body-parser';

let app = express();

app.use(helmet());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({limit: '3mb'}));
app.use(cookieParser());

mongoose.connect('mongodb://localhost/terrapin', { useMongoClient: true, promiseLibrary: bluebird });

app.use((req, res, next) => {
  // if the user sends us a webtoken, decode it
  if (req.cookies && req.cookies.cookieToken) {
    jwt.verify(req.cookies.cookieToken, secret, (err, decoded) => {
      if (!err) req.user = decoded;
      return next();
    });
  } else {
    next();
  }
});



routes(server); // initialize routes

server.listen(8080, () => {
  console.log('%s listening at %s', server.name, server.url);
});
