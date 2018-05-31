require('./src/_utils/bootstrap')
import express from 'express'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import jwt from 'jsonwebtoken'
import config from 'config'
import routes from './src'
import { isEmptyObject, _set } from './src/_utils'

let app = express()

app.use(helmet())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json({limit: '3mb'}))
app.use(cookieParser())
app.use((req, res, next) => {
  res.header('X-Frame-Options', 'SAMEORIGIN')
  res.header('Access-Control-Allow-Origin', config.clientDomain)
  res.header('Access-Control-Allow-Credentials', 'true')
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT,DELETE')
  res.header('Access-Control-Allow-Headers', 'Authorization, Access-Control-Allow-Headers, Origin, Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers')
  next()
})

app.set('trust proxy', 1) // trust first proxy

app.use((req, res, next) => {
  // if the user sends us a webtoken, decode it
  if (req.cookies && req.cookies.cookieToken) {
    jwt.verify(req.cookies.cookieToken, config.jwtSecret, (err, decoded) => {
      if (!err) _set(req, 'props.user', decoded)
      return next()
    })
  } else {
    next()
  }
})

registerRoutes(routes)

app.listen(config.port, () => {
  console.log('%s listening at %s', 'Shakedown Street', config.domain)
})

// this shit is magic
function registerRoutes(routeExports) {
  for (let routeExport in routeExports) {
    let routeDef = routeExports[routeExport]
    if (!routeDef || isEmptyObject(routeDef)) continue
    let routes = routeDef.routes
    for (let routeName in routes) {
      const routeMethods = routes[routeName]
      for (let routeMethod in routeMethods) {
        app[routeMethod](routeName, routeDef.routes[routeName][routeMethod])
      }
    }
  }
}
