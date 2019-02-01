const { mongoose } = require('../_utils/bootstrap')
import { _set } from '../_utils'

import config from 'config'
const { secretKey } = config.stripe

import httpMocks from 'node-mocks-http'

import { post } from '../_utils/http'

import mockTestEvent from '../integrations/mock/test-event'
import MockIntegration from '../integrations/mock/integration'

import Payout from './controller'
import User from '../users/controller'
import Event from '../events/controller'
import Ticket from '../tickets/controller'

import TicketInterface from '../tickets'
import PayoutInterface from '.'

describe('Payouts', () => {
  beforeAll(async() => {
    await mongoose.dropCollection('users')
    await mongoose.dropCollection('events')
    await mongoose.dropCollection('tickets')
    await mongoose.dropCollection('payouts')
  })

  afterEach(async() => {
    await mongoose.dropCollection('users')
    await mongoose.dropCollection('events')
    await mongoose.dropCollection('tickets')
    await mongoose.dropCollection('payouts')
  })

  it('should create a new payout', async() => {
    const event = await Event.createEvent(mockTestEvent)
    const seller = await User.createUser('seller@test.com', 'test')
    const buyer = await User.createUser('buyer@test.com', 'test')
    const ticketType = Object.keys(event.ticketTypes)[0]
    const barcode = await MockIntegration.issueTicket(event, seller, ticketType)

    const ticket = await Ticket.createTicket(event._id, seller._id, barcode, 1000, ticketType)

    const payout = await Payout.create({
      date: Date.now(),
      price: 1000,
      stripeChargeId: null,
      sellerId: seller._id,
      buyerId: buyer._id,
      ticketId: ticket._id,
      eventId: event._id,
      isPaid: false
    })

    expect(payout.sellerId).toEqual(seller._id)
    expect(payout.buyerId).toEqual(buyer._id)
    expect(payout.ticketId).toEqual(ticket._id)
  })

  it('should create a pending payment when a ticket is bought', async() => {
    // buya ticket
    const event = await Event.createEvent(mockTestEvent)
    const buyer = 'newUser@gogo.com'
    const owner = await User.createUser(`test@test${Math.random()}.com`, 'test')
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
          email: buyer
        },
        token: JSON.parse(res.body).id,
        reserveToken
      },
      params: {
        id: ticket._id
      }
    })

    const mockRes = httpMocks.createResponse()
    await TicketInterface.routes['/payment/:id'].post(mockReq, mockRes)
    const payouts = await Payout.find({ isPaid: false })
    const newUser = await User.getUserByEmail(buyer)
    expect(payouts[0].buyerId).toHaveProperty('_id', newUser._id)
  }, 30000)

  it('should get all unpaid payouts', async() => {
    const numPayouts = 5
    const event = await Event.createEvent(mockTestEvent)
    const admin = await User.createUser('reeder@terrapinticketing.com', 'test')
    const seller = await User.createUser('seller@test.com', 'test')
    const buyer = await User.createUser('buyer@test.com', 'test')
    const ticketType = Object.keys(event.ticketTypes)[0]
    const barcode = await MockIntegration.issueTicket(event, seller, ticketType)

    const ticket = await Ticket.createTicket(event._id, seller._id, barcode, 1000, ticketType)

    for (let i = 0; i < numPayouts; i++) {
      await Payout.create({
        date: Date.now(),
        price: 1000,
        stripeChargeId: null,
        sellerId: seller._id,
        buyerId: buyer._id,
        isPaid: false,
        eventId: event._id,
        ticketId: ticket._id
      })
    }

    const mockReq = httpMocks.createRequest({
      method: 'get',
      url: '/payouts'
    })

    _set(mockReq, 'props.user', admin)

    const mockRes = httpMocks.createResponse()
    await PayoutInterface.routes['/payouts'].get(mockReq, mockRes)
    const actualResponseBody = mockRes._getData()
    expect(actualResponseBody.length).toEqual(numPayouts)
  })

  it('should update payout isPaid to true', async() => {
    const event = await Event.createEvent(mockTestEvent)
    const admin = await User.createUser('reeder@terrapinticketing.com', 'test')
    const seller = await User.createUser('seller@test.com', 'test')
    const buyer = await User.createUser('buyer@test.com', 'test')
    const ticketType = Object.keys(event.ticketTypes)[0]
    const barcode = await MockIntegration.issueTicket(event, seller, ticketType)

    const ticket = await Ticket.createTicket(event._id, seller._id, barcode, 1000, ticketType)

    const payout = await Payout.create({
      date: Date.now(),
      price: 1000,
      stripeChargeId: null,
      sellerId: seller._id,
      buyerId: buyer._id,
      isPaid: false,
      eventId: event._id,
      ticketId: ticket._id
    })

    const mockReq = httpMocks.createRequest({
      method: 'put',
      url: `/payouts/${payout._id}/isPaid`,
      params: {
        id: payout._id
      }
    })

    _set(mockReq, 'props.user', admin)

    const mockRes = httpMocks.createResponse()
    await PayoutInterface.routes['/payouts/:id/isPaid'].put(mockReq, mockRes)
    const actualResponseBody = mockRes._getData()
    expect(actualResponseBody.isPaid).toBeTruthy()
  })

  it('should not allow non-admin to update payout', async() => {
    const admin = await User.createUser('not-reeder@terrapinticketing.com', 'test')
    const seller = await User.createUser('seller@test.com', 'test')
    const buyer = await User.createUser('buyer@test.com', 'test')
    const event = await Event.createEvent(mockTestEvent)
    const ticketType = Object.keys(event.ticketTypes)[0]
    const barcode = await MockIntegration.issueTicket(event, seller, ticketType)

    const ticket = await Ticket.createTicket(event._id, seller._id, barcode, 1000, ticketType)

    const payout = await Payout.create({
      date: Date.now(),
      price: 1000,
      stripeChargeId: null,
      sellerId: seller._id,
      buyerId: buyer._id,
      isPaid: false,
      eventId: event._id,
      ticketId: ticket._id
    })

    const mockReq = httpMocks.createRequest({
      method: 'put',
      url: `/payouts/${payout._id}/isPaid`,
      params: {
        id: payout._id
      }
    })

    _set(mockReq, 'props.user', admin)

    const mockRes = httpMocks.createResponse()
    await PayoutInterface.routes['/payouts/:id/isPaid'].put(mockReq, mockRes)
    const actualResponseBody = mockRes._getData()
    expect(actualResponseBody.error).toBe('unauthorized')
  })
})
