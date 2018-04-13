export function addRoutes(routes) {
  const wrappedRoutes = {}
  for (let routeName in routes) {
    const routeMethods = routes[routeName]
    for (let routeMethod in routeMethods) {
      const routeDef = routes[routeName][routeMethod]
      wrappedRoutes[routeName] = {}
      wrappedRoutes[routeName][routeMethod] = createRoute(routeDef)
    }
  }
  return wrappedRoutes
}

export function createRoute(routeDef) {
  let routeFunc = async(req, res) => {
    const { middleware, body } = routeDef
    try {
      // check params
      checkBody(req, res, body)
      if (res.headersSent) return

      // execute middleware
      await executeMiddleware(req, res, middleware)
      if (res.headersSent) return

      await routeDef.handler(req, res)
    } catch (e) {
      console.error(e.stack)
      res.sendStatus(500)
    }
  }
  return routeFunc
}

async function executeMiddleware(req, res, middleware=[]) {
  for (let mw of middleware) {
    await mw(req, res)
    // exit if a middleware sent res already
    if (res.headersSent) return
  }
}

function checkBody(req, res, body={}) {
  for (let param in body) {
    if (!req.body[param]) return res.send({ error: `missing param: ${param}` })
    if (typeof body[param] === 'function') {
      // call validators
      const normalizedParam = body[param](req.body[param])
      if (!normalizedParam) return res.send({ error: `validation failed for ${param}` })
      req.body[param] = normalizedParam
    }
  }
}
