const { mongoose } = require('../_utils/bootstrap')

import redis from '../_utils/redis'
import httpMocks from 'node-mocks-http'

import EventInterface from '.'
import mockTestEvent from '../integrations/mock/test-event'

import Event from './controller'

describe('Events', () => {
  describe('routes', () => {
    beforeAll(async() => {
      await mongoose.dropCollection('events')
      await Event.createEvent(mockTestEvent)
    })
    afterAll(async() => {
      await mongoose.dropCollection('events')
      await redis.flushdb()
    })
    afterEach(async() => {
      await mongoose.dropCollection('users')
      await mongoose.dropCollection('tickets')
    })

    it('should get event by id', async() => {
      const testEvent = mockTestEvent
      testEvent.urlSafe = 'TESTING'
      const event = await Event.createEvent(testEvent)
      const mockReq = httpMocks.createRequest({
        method: 'get',
        url: `/events/${event._id}`,
        params: {
          id: event._id
        }
      })
      const mockRes = httpMocks.createResponse()
      await EventInterface.routes['/events/:id'].get(mockReq, mockRes)
      const actualResponseBody = mockRes._getData()
      expect(actualResponseBody.event).toHaveProperty('_id', event._id)
    })

    it('should get event using query string', async() => {
      const urlSafe = 'urlSafeName'
      const testEvent = mockTestEvent
      testEvent.urlSafe = urlSafe
      await Event.createEvent(testEvent)
      const mockReq = httpMocks.createRequest({
        method: 'get',
        url: `/events?urlSafe=${urlSafe}`
      })
      const mockRes = httpMocks.createResponse()
      await EventInterface.routes['/events'].get(mockReq, mockRes)
      const actualResponseBody = mockRes._getData()
      expect(actualResponseBody.events[0]).toHaveProperty('urlSafe', urlSafe)
    })

    it('should activate a valid ticket', async() => {
      const mockReq = httpMocks.createRequest({
        method: 'POST',
        url: `/${mockTestEvent.urlSafe}/activate`,
        body: {
          email: 'test@email.com',
          barcode: '12345'
        },
        params: {
          urlSafe: mockTestEvent.urlSafe
        }
      })
      const mockRes = httpMocks.createResponse()
      await EventInterface.routes['/:urlSafe/activate'].post(mockReq, mockRes)
      const actualResponseBody = mockRes._getData()
      expect(actualResponseBody.ticket).toHaveProperty('barcode', '12345')
      expect(actualResponseBody.passwordChangeUrl).toBeTruthy()
    }, 10000)

    it('should return error for invalid event', async() => {
      const mockReq = httpMocks.createRequest({
        method: 'POST',
        url: `/${mockTestEvent.urlSafe}/activate`,
        body: {
          email: 'test@email.com',
          barcode: '12345'
        },
        params: {
          urlSafe: 'invalidevent'
        }
      })
      const mockRes = httpMocks.createResponse()
      await EventInterface.routes['/:urlSafe/activate'].post(mockReq, mockRes)
      const actualResponseBody = mockRes._getData()
      expect(actualResponseBody.error).toBeTruthy()
    }, 10000)

    it('shouldn\'t activate a barcode that already exists in the system', async() => {
      // intial request to activate the ticket
      const mockReq = httpMocks.createRequest({
        method: 'POST',
        url: `/${mockTestEvent.urlSafe}/activate`,
        body: {
          email: 'test@email.com',
          barcode: '12345'
        },
        params: {
          urlSafe: mockTestEvent.urlSafe
        }
      })
      const mockRes = httpMocks.createResponse()
      await EventInterface.routes['/:urlSafe/activate'].post(mockReq, mockRes)

      // second request to ensure tickets with the same barcode can't be uploaded more than once
      const mockReq2 = httpMocks.createRequest({
        method: 'POST',
        url: `/${mockTestEvent.urlSafe}/activate`,
        body: {
          email: 'test@email.com',
          barcode: '12345'
        },
        params: {
          urlSafe: mockTestEvent.urlSafe
        }
      })
      const mockRes2 = httpMocks.createResponse()
      await EventInterface.routes['/:urlSafe/activate'].post(mockReq2, mockRes2)
      const actualResponseBody2 = mockRes2._getData()
      expect(actualResponseBody2.error).toBe('This ticket has already been activated')
    }, 10000)

    it('shouldn\'t activate an invalid barcode', async() => {
      const mockReq = httpMocks.createRequest({
        method: 'POST',
        url: `/${mockTestEvent.urlSafe}/activate`,
        body: {
          email: 'test@email.com',
          barcode: 'not-valid-barcode'
        },
        params: {
          urlSafe: mockTestEvent.urlSafe
        }
      })
      const mockRes = httpMocks.createResponse()

      await EventInterface.routes['/:urlSafe/activate'].post(mockReq, mockRes)
      const actualResponseBody = mockRes._getData()
      expect(actualResponseBody.error).toBe('Invalid Ticket ID')
    }, 10000)

    it('shouldn\'t validate an invalid barcode', async() => {
      const mockReq = httpMocks.createRequest({
        method: 'POST',
        url: `/${mockTestEvent.urlSafe}/validate`,
        body: {
          barcode: 'not-valid-barcode'
        },
        params: {
          urlSafe: mockTestEvent.urlSafe
        }
      })
      const mockRes = httpMocks.createResponse()

      await EventInterface.routes['/:urlSafe/validate'].post(mockReq, mockRes)
      const actualResponseBody = mockRes._getData()
      expect(actualResponseBody).toHaveProperty('isValidTicket', false)
    }, 10000)
  })
})
