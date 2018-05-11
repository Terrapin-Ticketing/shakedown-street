const { mongoose } = require('../_utils/bootstrap')

import config from 'config'
const { secretKey } = config.stripe

import httpMocks from 'node-mocks-http'

import { post } from '../_utils/http'

import cinciRegisterTestEvent from '../integrations/cinci-register/test-event'
import CinciRegister from '../integrations/cinci-register/integration'

import Payout from './controller'
import User from '../users/controller'
import Event from '../events/controller'
import Ticket from '../tickets/controller'

import TicketInterface from '../tickets'

describe('Payouts', () => {
  afterEach(async() => {
    await mongoose.dropCollection('users')
    await mongoose.dropCollection('events')
    await mongoose.dropCollection('tickets')
    await mongoose.dropCollection('payouts')
  })

  it('should create a new payout', async() => {
    const seller = await User.createUser('seller@test.com', 'test')
    const buyer = await User.createUser('buyer@test.com', 'test')

    const payout = await Payout.create({
      date: Date.now(),
      price: 1000,
      stripeChargeId: null,
      sellerId: seller._id,
      buyerId: buyer._id,
      isPaid: false
    })

    expect(payout.sellerId).toEqual(seller._id)
    expect(payout.buyerId).toEqual(buyer._id)
  })

  it('should create a pending payment when a ticket is bought', async() => {
    // buya ticket
    const buyer = 'newUser@gogo.com'
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
        transferToEmail: buyer,
        token: res.body
      },
      params: {
        id: ticket._id
      }
    })

    const mockRes = httpMocks.createResponse()
    await TicketInterface.routes['/payment/:id'].post(mockReq, mockRes)
    const payouts = await Payout.find({ isPaid: false })
    const newUser = await User.getUserByEmail(buyer)
    expect(payouts[0]).toHaveProperty('buyerId', newUser._id)
  }, 20000)

  // it('should', async() => {
  //
  // })
})
