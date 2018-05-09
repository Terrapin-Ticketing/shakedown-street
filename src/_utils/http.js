import request from 'request'
import url from 'url'
import setCookie from 'set-cookie-parser'
import queryString from 'query-string'

export async function post(route, formData, cookieValue, extraHeaders, json) {
  // const { protocol, host, port } = url.parse(route)
  // const domain = port ? `${protocol}//${host}:${port}` : `${protocol}//${host}`
  //
  // let jar = request.jar()
  // const stringifiedCookie = queryString.stringify(cookieValue)
  // let cookie = request.cookie(stringifiedCookie)
  //
  // jar.setCookie(cookie, domain)
  // let options = {
  //   method: 'POST',
  //   url: route,
  //   jar,
  //   form: formData,
  //   headers: {
  //     'Content-Type': 'application/x-www-form-urlencoded',
  //     ...extraHeaders
  //   }
  // }

  // return await new Promise((resolve, reject) => { // eslint-disable-line
  //   request(options, (err, res) => {
  //     if (err) return reject(err)
  //     const cookies = {}
  //     for (let cookie of setCookie.parse(res)) {
  //       cookies[cookie.name] = cookie.value
  //     }
  //     res.cookies = cookies
  //     resolve(res)
  //   })
  // })

  return await x({ route, formData, cookieValue, extraHeaders, method: 'post', json })
}

export async function get(route, cookieValue, extraHeaders, json) {
  return await x({ route, cookieValue, extraHeaders, method: 'get', json })
}

async function x(config) {
  const { route, formData, json, cookieValue, extraHeaders, method } = config

  const { protocol, host, port } = url.parse(route)
  const domain = port ? `${protocol}//${host}:${port}` : `${protocol}//${host}`

  let jar = request.jar()
  const stringifiedCookie = queryString.stringify(cookieValue)
  let cookie = request.cookie(stringifiedCookie)

  jar.setCookie(cookie, domain)
  console.log({
    'Content-Type': 'application/x-www-form-urlencoded',
    ...extraHeaders
  })
  let options = {
    method,
    url: route,
    jar,
    // form: formData,
    json,
    form: formData,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...extraHeaders
    }
  }

  return await new Promise((resolve, reject) => { // eslint-disable-line
    request(options, (err, res) => {
      if (err) return reject(err)
      const cookies = {}
      for (let cookie of setCookie.parse(res)) {
        cookies[cookie.name] = cookie.value
      }
      res.cookies = cookies
      resolve(res)
    })
  })
}
