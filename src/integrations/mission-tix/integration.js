import IntegrationInterface from '../IntegrationInterface'
import { post } from '../../_utils/http'
import redis from '../../_utils/redis'

class MissionTixTicketIntegration extends IntegrationInterface {
  async login() {
    const serializedSessionCookies = await redis.get('mission-tix', 'sessionCookies')
    const sessionCookies = JSON.parse(serializedSessionCookies)
    if (sessionCookies) return sessionCookies

    const eventUrl = process.env.MISSION_TIX_LOGIN_URL
    const res = await post(eventUrl, {}, {}, {
      'dome-key': process.env.MISSION_TIX_API_KEY,
      'Content-Type': 'application/json'
    })
    console.log('res:', res)
  }

  async isValidTicket(barcode) {

  }

  async issueTicket() {
    const res = await post(eventUrl, {}, {}, {
      'dome-key': process.env.MISSION_TIX_API_KEY,
      'Content-Type': 'application/json'
    })
    console.log('res:', res)
  }
}


export default new MissionTixTicketIntegration()
