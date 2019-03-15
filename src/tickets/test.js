const { mongoose } = require('../_utils/bootstrap')
import uuidv1 from 'uuid/v4'
import redis from '../_utils/redis'

import httpMocks from 'node-mocks-http'
import Event from '../events/controller'
import User from '../users/controller'
import mockTestEvent from '../integrations/mock/test-event'
import MockIntegration from '../integrations/mock/integration'
import config from 'config'
import { post } from '../_utils/http'
import { _set } from '../_utils'
const { secretKey } = config.stripe

import TicketInterface from '.'
const Ticket = TicketInterface.controller

describe('Ticket', () => {
  describe('routes', () => {
    beforeAll(async() => {
      await mongoose.dropCollection('events')
    })
    afterEach(async() => {
      await mongoose.dropCollection('events')
      await mongoose.dropCollection('users')
      await mongoose.dropCollection('tickets')
    })

    it('should get all tickets with given query param', async() => {
      const user = await User.createUser('test@test.com', 'test')
      const event = await Event.createEvent(mockTestEvent)
      const ticketType = Object.keys(event.ticketTypes)[0]
      const cinciRegisterBarcode = await MockIntegration.issueTicket(event, user, ticketType)
      await Ticket.createTicket(event._id, user._id, cinciRegisterBarcode, 1000, ticketType)
      const mockReq = httpMocks.createRequest({
        method: 'get',
        url: `/tickets?ownerId=${user._id}`
      })
      const mockRes = httpMocks.createResponse()
      await TicketInterface.routes['/tickets'].get(mockReq, mockRes)
      const actualResponseBody = mockRes._getData()
      expect(actualResponseBody.tickets[0]).toHaveProperty('ownerId', user._id)
    }, 8000)

    it('should get all available tickets with given query param', async() => {
      const user = await User.createUser('test@test.com', 'test')
      const event = await Event.createEvent(mockTestEvent)
      const ticketType = Object.keys(event.ticketTypes)[0]
      const cinciRegisterBarcode = await MockIntegration.issueTicket(event, user, ticketType)
      const ticket = await Ticket.createTicket(event._id, user._id, cinciRegisterBarcode, 1000, ticketType)
      await Ticket.set(ticket._id, { isForSale: true })

      const mockReq = httpMocks.createRequest({
        method: 'get',
        url: '/tickets/available?isForSale=true'
      })
      const mockRes = httpMocks.createResponse()
      await TicketInterface.routes['/tickets/available'].get(mockReq, mockRes)
      const actualResponseBody = mockRes._getData()
      expect(actualResponseBody.tickets[0]).toHaveProperty('ownerId', user._id)
    }, 8000)

    it('should delete reserve-token', async() => {
      const user = await User.createUser('test@test.com', 'test')
      const event = await Event.createEvent(mockTestEvent)
      const ticketType = Object.keys(event.ticketTypes)[0]
      const cinciRegisterBarcode = await MockIntegration.issueTicket(event, user, ticketType)
      const ticket = await Ticket.createTicket(event._id, user._id, cinciRegisterBarcode, 1000, ticketType)
      await Ticket.set(ticket._id, { isForSale: true })

      const reserveToken = uuidv1()
      await redis.set('reserve-token', String(ticket._id), reserveToken, 60*15)

      const mockReq = httpMocks.createRequest({
        method: 'delete',
        url: `/tickets/${ticket._id}/reserve?reserveToken=${reserveToken}`,
        params: {
          id: ticket._id
        }
      })
      const mockRes = httpMocks.createResponse()
      await TicketInterface.routes['/tickets/:id/reserve'].delete(mockReq, mockRes)
      const savedToken = await redis.get('reserve-token', String(ticket._id))
      expect(savedToken).toEqual(false)
    }, 8000)

    it('shouldn\'t return reserved tickets', async() => {
      const user = await User.createUser('test@test.com', 'test')
      const event = await Event.createEvent(mockTestEvent)
      const ticketType = Object.keys(event.ticketTypes)[0]
      const cinciRegisterBarcode = await MockIntegration.issueTicket(event, user, ticketType)
      const ticket = await Ticket.createTicket(event._id, user._id, cinciRegisterBarcode, 1000, ticketType)
      await Ticket.set(ticket._id, { isForSale: true })
      await redis.set('reserve-token', ticket._id, uuidv1(), 60*15)

      const mockReq = httpMocks.createRequest({
        method: 'get',
        url: '/tickets/available?isForSale=true'
      })
      const mockRes = httpMocks.createResponse()
      await TicketInterface.routes['/tickets/available'].get(mockReq, mockRes)
      const actualResponseBody = mockRes._getData()
      expect(actualResponseBody.tickets.length).toEqual(0)
    }, 8000)

    it('should remove barcodes from tickets', async() => {
      const user = await User.createUser('test@test.com', 'test')
      const event = await Event.createEvent(mockTestEvent)
      const ticketType = Object.keys(event.ticketTypes)[0]

      for (let n of new Array(3)) { // eslint-disable-line
        const barcode = await MockIntegration.issueTicket(event, user, ticketType)
        await Ticket.createTicket(event._id, user._id, barcode, 1000, ticketType)
      }

      const mockReq = httpMocks.createRequest({
        method: 'get',
        url: `/tickets?eventId=${event._id}`
      })
      const mockRes = httpMocks.createResponse()
      await TicketInterface.routes['/tickets'].get(mockReq, mockRes)
      const actualResponseBody = mockRes._getData()
      expect(actualResponseBody.tickets[0]).toHaveProperty('barcode', null)
    }, 10000)

    it('should update owned ticket', async() => {
      const user = await User.createUser('test@test.com', 'test')
      const event = await Event.createEvent(mockTestEvent)
      const ticketType = Object.keys(event.ticketTypes)[0]

      const barcode = await MockIntegration.issueTicket(event, user, ticketType)
      const ticket = await Ticket.createTicket(event._id, user._id, barcode, 1000, ticketType)

      const mockReq = httpMocks.createRequest({
        method: 'put',
        url: `/tickets/${ticket._id}`,
        body: {
          isForSale: true,
          price: 0
        },
        params: {
          id: ticket._id
        }
      })
      const mockRes = httpMocks.createResponse()
      _set(mockReq, 'props.user', user)
      await TicketInterface.routes['/tickets/:id'].put(mockReq, mockRes)
      const actualResponseBody = mockRes._getData()
      expect(actualResponseBody.ticket).toHaveProperty('isForSale', true)
    }, 8000)

    it('should NOT allow update of unowned ticket', async() => {
      const owner = await User.createUser('test@test.com', 'test')
      const imposter = await User.createUser('notTest@test.com', 'test')

      const event = await Event.createEvent(mockTestEvent)
      const ticketType = Object.keys(event.ticketTypes)[0]

      const barcode = await MockIntegration.issueTicket(event, owner, ticketType)
      const ticket = await Ticket.createTicket(event._id, owner._id, barcode, 1000, ticketType)

      const mockReq = httpMocks.createRequest({
        method: 'put',
        url: `/tickets/${ticket._id}`,
        body: {
          isForSale: true,
          price: 0
        },
        params: {
          id: ticket._id
        }
      })
      const mockRes = httpMocks.createResponse()
      _set(mockReq, 'props.user', imposter)
      await TicketInterface.routes['/tickets/:id'].put(mockReq, mockRes)
      const actualResponseBody = mockRes._getData()
      expect(actualResponseBody.error).toBe('unauthorized')
    }, 8000)

    it('should transfer ticket to new user', async() => {
      const owner = await User.createUser('test@test.com', 'test')
      const event = await Event.createEvent(mockTestEvent)
      const ticketType = Object.keys(event.ticketTypes)[0]
      const barcode = await MockIntegration.issueTicket(event, owner, ticketType)
      const ticket = await Ticket.createTicket(event._id, owner._id, barcode, 1000, ticketType)

      const mockReq = httpMocks.createRequest({
        method: 'post',
        url: `/tickets/${ticket._id}/transfer`,
        body: {
          transferToUser: {
            firstName: 'Meg',
            lastName: 'Griffin',
            email: 'newUser@test.com'
          }
        },
        params: {
          id: ticket._id
        }
      })

      _set(mockReq, 'props.user', owner)
      const mockRes = httpMocks.createResponse()
      await TicketInterface.routes['/tickets/:id/transfer'].post(mockReq, mockRes)
      const actualResponseBody = mockRes._getData()
      const newUser = await User.getUserByEmail('newUser@test.com')
      expect(actualResponseBody.ticket).toHaveProperty('_id', ticket._id)
      expect(actualResponseBody.ticket).toHaveProperty('ownerId', newUser._id)
    }, 30000)

    it('should purchace ticket with stripe token', async() => {
      const owner = await User.createUser('test@test.com', 'test')
      const event = await Event.createEvent(mockTestEvent)
      const ticketType = Object.keys(event.ticketTypes)[0]
      if (!owner) console.log('no owner:', owner)
      const barcode = await MockIntegration.issueTicket(event, owner, ticketType)
      const initTicket = await Ticket.createTicket(event._id, owner._id, barcode, 1000, ticketType)
      const ticket = await Ticket.set(initTicket._id, {
        isForSale: true
      })

      const buyer = await User.createUser('notTest@test.com', 'test')

      // get stripe token
      const cardInfo = {
        'card[number]': 4242424242424242,
        'card[exp_month]': 12,
        'card[exp_year]': 2019,
        'card[cvc]': 123
      }
      const res = await post({
        url: 'https://api.stripe.com/v1/tokens',
        form: cardInfo,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${secretKey}`
        }
      })

      // get reserve token
      const mockReqReserveToken = httpMocks.createRequest({
        method: 'get',
        url: `/tickets/${ticket._id}/reserve`,
        params: {
          id: ticket._id
        }
      })

      const mockResReserveToken = httpMocks.createResponse()
      await TicketInterface.routes['/tickets/:id/reserve'].get(mockReqReserveToken, mockResReserveToken)
      const actualResponseBodyReserveTicket = mockResReserveToken._getData()
      const { reserveToken } = actualResponseBodyReserveTicket

      const mockReq = httpMocks.createRequest({
        method: 'put',
        url: `/payment/${ticket._id}`,
        body: {
          transferToUser: {
            email: buyer.email,
            firstName: 'Greg',
            lastName: 'Ormant'
          },
          token: res.body,
          reserveToken
        },
        params: {
          id: ticket._id
        }
      })

      _set(mockReq, 'props.user', buyer)
      const mockRes = httpMocks.createResponse()
      await TicketInterface.routes['/payment/:id'].post(mockReq, mockRes)
      const actualResponseBody = mockRes._getData()
      const { charge, passwordChangeUrl } = actualResponseBody
      expect(charge).toBeTruthy()
      expect(passwordChangeUrl).toBeFalsy() // TODO: test with new user
      expect(actualResponseBody.ticket).toHaveProperty('ownerId', buyer._id)
    }, 35000)

    it('should purchace ticket by new user', async() => {
      const owner = await User.createUser(`test@test${Math.random()}.com`, 'test')
      const event = await Event.createEvent(mockTestEvent)
      const ticketType = Object.keys(event.ticketTypes)[0]
      const barcode = await MockIntegration.issueTicket(event, owner, ticketType)
      const initTicket = await Ticket.createTicket(event._id, owner._id, barcode, 1000, ticketType)
      const ticket = await Ticket.set(initTicket._id, {
        isForSale: true
      })

      const cardInfo = {
        'card[number]': 4242424242424242,
        'card[exp_month]': 12,
        'card[exp_year]': 2019,
        'card[cvc]': 123
      }
      const res = await post({
        url: 'https://api.stripe.com/v1/tokens',
        form: cardInfo,
        headers: {
          'Authorization': `Bearer ${secretKey}`
        }
      })

      // get reserve token
      const mockReqReserveToken = httpMocks.createRequest({
        method: 'get',
        url: `/tickets/${ticket._id}/reserve`,
        params: {
          id: ticket._id
        }
      })

      const mockResReserveToken = httpMocks.createResponse()
      await TicketInterface.routes['/tickets/:id/reserve'].get(mockReqReserveToken, mockResReserveToken)
      const actualResponseBodyReserveTicket = mockResReserveToken._getData()
      const { reserveToken } = actualResponseBodyReserveTicket

      const mockReq = httpMocks.createRequest({
        method: 'put',
        url: `/payment/${ticket._id}`,
        body: {
          transferToUser: {
            email: 'newUser@gogo.com',
            firstName: 'Jermy',
            lastName: 'Sha'
          },
          token: res.body,
          reserveToken
        },
        params: {
          id: ticket._id
        }
      })

      const mockRes = httpMocks.createResponse()
      await TicketInterface.routes['/payment/:id'].post(mockReq, mockRes)
      const actualResponseBody = mockRes._getData()
      const { charge, passwordChangeUrl } = actualResponseBody
      expect(charge).toBeTruthy()
      expect(passwordChangeUrl).toBeTruthy()
    }, 30000)

    it('should not allow ticket purchace without valid reserve token', async() => {
      const owner = await User.createUser(`test@test${Math.random()}.com`, 'test')
      const event = await Event.createEvent(mockTestEvent)
      const ticketType = Object.keys(event.ticketTypes)[0]
      const barcode = await MockIntegration.issueTicket(event, owner, ticketType)
      const initTicket = await Ticket.createTicket(event._id, owner._id, barcode, 1000, ticketType)
      const ticket = await Ticket.set(initTicket._id, {
        isForSale: true
      })

      const cardInfo = {
        'card[number]': 4242424242424242,
        'card[exp_month]': 12,
        'card[exp_year]': 2019,
        'card[cvc]': 123
      }
      const res = await post({
        url: 'https://api.stripe.com/v1/tokens',
        form: cardInfo,
        headers: {
          'Authorization': `Bearer ${secretKey}`
        }
      })

      // get reserve token
      const reserveToken = 'not-a-valid-token'

      const mockReq = httpMocks.createRequest({
        method: 'put',
        url: `/payment/${ticket._id}`,
        body: {
          transferToUser: {
            email: 'newUser@gogo.com'
          },
          token: res.body,
          reserveToken
        },
        params: {
          id: ticket._id
        }
      })

      const mockRes = httpMocks.createResponse()
      await TicketInterface.routes['/payment/:id'].post(mockReq, mockRes)
      const actualResponseBody = mockRes._getData()
      expect(actualResponseBody.error).toBeDefined()
    }, 30000)


    it('should issue a reserve ticket token', async() => {
      const owner = await User.createUser('test@test.com', 'test')
      const event = await Event.createEvent(mockTestEvent)
      const ticketType = Object.keys(event.ticketTypes)[0]
      const barcode = await MockIntegration.issueTicket(event, owner, ticketType)
      const buyableTicket = await Ticket.createTicket(event._id, owner._id, barcode, 1000, ticketType)
      await Ticket.set(buyableTicket._id, { isForSale: true })

      const mockReq = httpMocks.createRequest({
        method: 'get',
        url: `/tickets/${buyableTicket._id}/reserve`,
        params: {
          id: buyableTicket._id
        }
      })

      const mockRes = httpMocks.createResponse()
      await TicketInterface.routes['/tickets/:id/reserve'].get(mockReq, mockRes)
      const actualResponseBody = mockRes._getData()
      const { ticket, reserveToken } = actualResponseBody
      expect(String(ticket._id)).toBe(String(buyableTicket._id))
      expect(reserveToken).toBeDefined()
    })
  })
})
