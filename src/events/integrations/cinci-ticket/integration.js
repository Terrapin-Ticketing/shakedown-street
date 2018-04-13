import IntegrationInterface from '../IntegrationInterface'
import { post, get } from '../../../_utils/http'
import redis from '../../../_utils/redis'

class CinciTicketIntegration extends IntegrationInterface {

  async login(username, password) {
    const sessionId = await redis.get('cinci-ticket', 'sessionId')
    if (sessionId) return sessionId

    const loginUrl = 'https://cincyticket.showare.com/admin/login.asp'
    const formData = {
      frm_login: username,
      frm_password: password,
      activity: 'Login'
    }
    const res = await post(loginUrl, formData)
    console.log(res.headers);
    console.log(res.body);

  }



}


export default new CinciTicketIntegration()
