// you must require bootstrap.js to initialize env vars and db connection

const mongoose = require('./db').default // initialize mongoose
require('dotenv').config() // doesn't return anything

export {
  mongoose
}
