import config from 'config'

import { post, get } from '../../_utils/http'
import redis from '../../_utils/redis'

import IntegrationInterface from '../IntegrationInterface'
import Event from '../../events/controller'


class MissionTixTicketIntegration extends IntegrationInterface {
  static integrationType = 'MissionTix'

  async login(eventId) {
    // const authKey = await redis.get('mission-tix', 'authKey')
    // if (authKey || config.env !== 'test') return authKey
    const event = await Event.getEventById(eventId)
    if (!event) return false
    const { auth, username, password } = await Event.getEventById(eventId)


    const res = await post({
      url: auth.loginUrl,
      json: {
        username,
        password
      },
      headers: {
        [auth.apiKeyName]: auth.apiKey,
        'Content-Type': 'application/json'
      }
    })

    const res = await post(auth.loginUrl, null, {}, {
      [auth.apiKeyName]: auth.apiKey,
      'Content-Type': 'application/json'
    }, {
      username,
      password
    })
    console.log('res.body:', res.body)
    const authKey = res.body.auth_key

    return {
      apiKey: auth.apiKey,
      authKey
    }
  }

  async isValidTicket(barcode, event) {
    const { auth, externalEventId } = event
    // const url = `https://www.mt.cm/domefest/getTicketDetails?user_id=${auth.userId}&event_id=${externalEventId}&data=${barcode}`
    const url = `https://www.mt.cm/domefest/${externalEventId}/order-all-checkin`
    const res = await get(url, {}, {
      [auth.apiKeyName]: auth.apiKey,
      'auth-key': auth.authKey
    })
    const { body } = res
    console.log('body:', res)
    const isValid = body.status === 'ok' && body.result_msg === 'Barcode is valid.'
    return isValid
  }

  async deactivateTicket(eventId, barcode) {
    const event = await Event.getEventById(eventId)
    if (!event) return false

    const isValid = this.isValidTicket(barcode, event)
    if (!isValid) return false

    const { auth, externalEventId } = event
    const url = `https://www.mt.cm/domefest/getTicketDetails?user_id=${auth.userId}&event_id=${externalEventId}&data=${barcode}`
    const res = await get(url, {}, {
      [auth.apiKeyName]: auth.apiKey,
      'auth-key': auth.authKey
    })

    const { body } = res
    const success = body.status === 'ok' && body.result_msg === 'Barcode is valid.'
    return success
  }

  async getEventInfo(eventId) {
    const event = await Event.getEventById(eventId)

    const { auth, externalEventId } = event
    const url = `https://www.mt.cm/domefest/details/${auth.userId}/${externalEventId}`

    const res = await get(url, {}, {
      [auth.apiKeyName]: auth.apiKey,
      'auth-key': auth.authKey
    })
    if (!res.body) return false
    return JSON.parse(res.body)
  }
  // deactivateTicket(eventId, barcode) { throw new Error('not implemented') }
  // issueTicket(event, user, type) { throw new Error('not implemented') }
  // isValidTicket(ticketId) { throw new Error('not implemented') }
  // getTicketInfo(ticketId) { throw new Error('not implemented') } // all integrations should return same format for getTicketInfo
  // // getEventInfo can be used to hit the event's api if we want live data
  // getEventInfo(eventId) { throw new Error('not implemented') } // all integrations should return same format for getEventInfo
  // getTicketTypes(eventId) { throw new Error('not implemented') }
  // transferTicket(ticket, toUser) { throw new Error('not implemented') }


  // async issueTicket() {
  //   const res = await post(eventUrl, {}, {}, {
  //     [auth.apiKeyName]: process.env.MISSION_TIX_API_KEY,
  //     'Content-Type': 'application/json'
  //   })
  //   console.log('res:', res)
  // }
}


export default new MissionTixTicketIntegration()
