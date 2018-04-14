import request from 'request'
import url from 'url'
import setCookie from 'set-cookie-parser'
import queryString from 'query-string'

export async function post(route, formData, cookieValue, extraHeaders) {
  const { protocol, host, port } = url.parse(route)
  const domain = port ? `${protocol}//${host}:${port}` : `${protocol}//${host}`

  let jar = request.jar()
  const stringifiedCookie = queryString.stringify(cookieValue)
  let cookie = request.cookie(stringifiedCookie)

  jar.setCookie(cookie, domain)
  let options = {
    method: 'POST',
    url: route,
    jar,
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

export async function get(route) {
  return await new Promise((resolve, reject) => {
    return request(route, (err, res) => {
      if (err) return reject(err)
      resolve(res)
    })
  })
}
