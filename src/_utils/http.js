import request from 'request'
import url from 'url'

export async function post(route, formData, cookieValue) {
  const { protocol, host, port } = url.parse(route)
  const domain = port ? `${protocol}//${host}:${port}` : `${protocol}//${host}`

  let jar = request.jar()
  let cookie = request.cookie(`session_id=${cookieValue}`)

  jar.setCookie(cookie, domain)
  let options = {
    method: 'POST',
    url: route,
    formData,
    jar,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }
  return await new Promise((resolve, reject) => { // eslint-disable-line
    request(options, (err, res) => {
      if (err) return reject(err)
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
