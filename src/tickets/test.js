const { mongoose } = require('../_utils/bootstrap')

import httpMocks from 'node-mocks-http'
import Event from '../events/controller'
import User from '../users/controller'
import cinciRegisterTestEvent from '../integrations/cinci-register/test-event'
import CinciRegister from '../integrations/cinci-register/integration'
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
      const event = await Event.createEvent(cinciRegisterTestEvent)
      const ticketType = Object.keys(event.ticketTypes)[0]
      const cinciRegisterBarcode = await CinciRegister.issueTicket(event, user, ticketType)
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

    it('should remove barcodes from tickets', async() => {
      const user = await User.createUser('test@test.com', 'test')
      const event = await Event.createEvent(cinciRegisterTestEvent)
      const ticketType = Object.keys(event.ticketTypes)[0]

      for (let n of new Array(3)) { // eslint-disable-line
        const barcode = await CinciRegister.issueTicket(event, user, ticketType)
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
      const event = await Event.createEvent(cinciRegisterTestEvent)
      const ticketType = Object.keys(event.ticketTypes)[0]

      const barcode = await CinciRegister.issueTicket(event, user, ticketType)
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

      const event = await Event.createEvent(cinciRegisterTestEvent)
      const ticketType = Object.keys(event.ticketTypes)[0]

      const barcode = await CinciRegister.issueTicket(event, owner, ticketType)
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
      const event = await Event.createEvent(cinciRegisterTestEvent)
      const ticketType = Object.keys(event.ticketTypes)[0]
      const barcode = await CinciRegister.issueTicket(event, owner, ticketType)
      const ticket = await Ticket.createTicket(event._id, owner._id, barcode, 1000, ticketType)

      const mockReq = httpMocks.createRequest({
        method: 'post',
        url: `/tickets/${ticket._id}/transfer`,
        body: {
          transferToEmail: 'newUser@test.com'
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
    }, 15000)

    it('should purchace ticket with stripe token', async() => {
      const owner = await User.createUser('test@test.com', 'test')
      const event = await Event.createEvent(cinciRegisterTestEvent)
      const ticketType = Object.keys(event.ticketTypes)[0]
      if (!owner) console.log('no owner:', owner)
      const barcode = await CinciRegister.issueTicket(event, owner, ticketType)
      const initTicket = await Ticket.createTicket(event._id, owner._id, barcode, 1000, ticketType)
      const ticket = await Ticket.set(initTicket._id, {
        isForSale: true
      })

      const buyer = await User.createUser('notTest@test.com', 'test')

      const cardInfo = {
        'card[number]': 4242424242424242,
        'card[exp_month]': 12,
        'card[exp_year]': 2019,
        'card[cvc]': 123
      }
      const res = await post({
        url: 'https://api.stripe.com/v1/tokens',
        form: {
          ...cardInfo
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${secretKey}`
        }
      })

      const mockReq = httpMocks.createRequest({
        method: 'put',
        url: `/payment/${ticket._id}`,
        body: {
          transferToEmail: buyer.email,
          token: res.body
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
    }, 15000)

    it('should purchace ticket by new user', async() => {
      const owner = await User.createUser(`test@test${Math.random()}.com`, 'test')
      const event = await Event.createEvent(cinciRegisterTestEvent)
      const ticketType = Object.keys(event.ticketTypes)[0]
      const barcode = await CinciRegister.issueTicket(event, owner, ticketType)
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

      const mockReq = httpMocks.createRequest({
        method: 'put',
        url: `/payment/${ticket._id}`,
        body: {
          transferToEmail: 'newUser@gogo.com',
          token: res.body
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
    }, 15000)
  })
})
