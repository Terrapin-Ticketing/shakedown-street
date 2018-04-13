const { mongoose } = require('../_utils/bootstrap')

import httpMocks from 'node-mocks-http'
import Event from '../events/controller'
import User from '../users/controller'
import cinciRegisterTestEvent from '../events/integrations/cinci-register/test-event'
import CinciRegister from '../events/integrations/cinci-register/integration'

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
      mockReq.user = user
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
      mockReq.user = imposter
      await TicketInterface.routes['/tickets/:id'].put(mockReq, mockRes)
      const actualResponseBody = mockRes._getData()
      expect(actualResponseBody.error).toBe('unauthorized')
    }, 8000)

    // it.skip('should purchace ticket with test stripe token', async() => {
    //   const owner = await User.createUser('test@test.com', 'test')
    //   const buyer = await User.createUser('notTest@test.com', 'test')
    //
    //   const event = await Event.createEvent(cinciRegisterTestEvent)
    //   const ticketType = Object.keys(event.ticketTypes)[0]
    //
    //   const barcode = await CinciRegister.issueTicket(event, owner, ticketType)
    //   const ticket = await Ticket.createTicket(event._id, owner._id, barcode, 1000, ticketType)
    //
    //   const mockReq = httpMocks.createRequest({
    //     method: 'put',
    //     url: `/tickets/${ticket._id}`,
    //     body: {
    //       isForSale: true,
    //       price: 0
    //     },
    //     params: {
    //       id: ticket._id
    //     }
    //   })
    //   const mockRes = httpMocks.createResponse()
    //   mockReq.user = imposter
    //   await TicketInterface.routes['/tickets/:id'].put(mockReq, mockRes)
    //   const actualResponseBody = mockRes._getData()
    //   expect(actualResponseBody.error).toBe('unauthorized')
    // }, 8000)
  })
})
