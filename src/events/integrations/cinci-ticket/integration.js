import IntegrationInterface from '../IntegrationInterface'
import { post } from '../../../_utils/http'
import redis from '../../../_utils/redis'

class CinciTicketIntegration extends IntegrationInterface {
  async login(username, password) {
    const serializedSessionCookies = await redis.get('cinci-ticket', 'sessionCookies')
    const sessionCookies = JSON.parse(serializedSessionCookies)
    if (sessionCookies) return sessionCookies

    const loginUrl = process.env.CINCI_TICKET_LOGIN_URL
    const formData = {
      frm_login: username,
      frm_password: password,
      activity: 'Login'
    }
    const res = await post(loginUrl, formData)
    await redis.set('cinci-ticket', 'sessionCookies', JSON.stringify(res.cookies), 60*60)
    return res.cookies
  }
}


export default new CinciTicketIntegration()
