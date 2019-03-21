import request from 'request'
import urlParse from 'url'
import setCookie from 'set-cookie-parser'
import queryString from 'query-string'

export async function post(config) {
  return await req({ method: 'POST', ...config })
}

export async function get(url, config) {
  return await req({ ...config, url, method: 'GET' })
}

async function req(config) {
  const { url, form, json, cookieValue, headers, method, followRedirect, formData, timeout } = config

  const { protocol, host, port } = urlParse.parse(url)
  const domain = port ? `${protocol}//${host}:${port}` : `${protocol}//${host}`

  let jar = request.jar()
  const stringifiedCookie = queryString.stringify(cookieValue)
  let cookie = request.cookie(stringifiedCookie)

  jar.setCookie(cookie, domain)
  let options = {
    method,
    url,
    jar,
    json,
    form,
    headers,
    formData,
    followRedirect,
    timeout
  }

  return await new Promise((resolve, reject) => { // eslint-disable-line
    request(options, (err, res) => {
      if (err) return reject(err)
      const cookies = {}
      for (let cookie of setCookie.parse(res)) {
        cookies[cookie.name] = cookie.value
      }
      res.cookies = cookies

      let rawCookies = ''
      for (let cookieKey in cookies) {
        rawCookies += `${cookieKey}=${cookies[cookieKey]};`
      }
      res.rawCookies = rawCookies
      resolve(res)
    })
  })
}
