const { mongoose } = require('../_utils/bootstrap')

import { _set } from '../_utils'

import httpMocks from 'node-mocks-http'

import mockTestEvent from '../integrations/mock/test-event'
import MockIntegration from '../integrations/mock/integration'

import Transfer from './controller'
import User from '../users/controller'
import Event from '../events/controller'
import Ticket from '../tickets/controller'

import TicketInterface from '../tickets'
import TransfersInterface from '.'

describe('Transfers', () => {
  beforeAll(async() => {
    await mongoose.dropCollection('users')
    await mongoose.dropCollection('events')
    await mongoose.dropCollection('tickets')
    await mongoose.dropCollection('transfers')
  })

  afterEach(async() => {
    await mongoose.dropCollection('users')
    await mongoose.dropCollection('events')
    await mongoose.dropCollection('tickets')
    await mongoose.dropCollection('transfers')
  })

  it('should create a new transfer', async() => {
    const seller = await User.createUser('seller@test.com', 'test')
    const buyer = await User.createUser('buyer@test.com', 'test')
    const event = await Event.createEvent(mockTestEvent)
    const ticketType = Object.keys(event.ticketTypes)[0]
    const barcode = await MockIntegration.issueTicket(event, seller, ticketType)

    const ticket = await Ticket.createTicket(event._id, seller._id, barcode, 1000, ticketType)

    const transfer = await Transfer.create({
      date: Date.now(),
      senderId: seller._id,
      recieverId: buyer._id,
      ticketId: ticket._id,
      eventId: event._id
    })

    expect(transfer.senderId).toEqual(seller._id)
    expect(transfer.recieverId).toEqual(buyer._id)
    expect(transfer.ticketId).toEqual(ticket._id)
  })

  it('should create a transfer entry when a ticket is transfered', async() => {
    // buya ticket
    const receiverEmail = 'receive@test.com'
    const owner = await User.createUser(`test@test${Math.random()}.com`, 'test')
    const event = await Event.createEvent(mockTestEvent)
    const ticketType = Object.keys(event.ticketTypes)[0]
    const barcode = await MockIntegration.issueTicket(event, owner, ticketType)
    const ticket = await Ticket.createTicket(event._id, owner._id, barcode, 1000, ticketType)

    const mockReq = httpMocks.createRequest({
      method: 'post',
      url: `/tickets/${ticket._id}/transfer`,
      body: {
        transferToUser: {
          email: receiverEmail
        }
      },
      params: {
        id: ticket._id
      }
    })

    _set(mockReq, 'props.user', owner)
    const mockRes = httpMocks.createResponse()
    await TicketInterface.routes['/tickets/:id/transfer'].post(mockReq, mockRes)

    const transfers = await Transfer.find({})
    const transfer = transfers[0]
    expect(transfer.prevBarcode).toEqual(barcode)
    expect(transfer.senderId._id).toEqual(owner._id)
  }, 20000)

  it('should get all tranfers with given evnet id', async() => {
    // buya ticket
    const reciever = await User.createUser('receive@test.com', 'test')
    const owner = await User.createUser('reeder@terrapinticketing.com', 'test')
    const event = await Event.createEvent(mockTestEvent)
    const ticketType = Object.keys(event.ticketTypes)[0]
    const barcode = await MockIntegration.issueTicket(event, owner, ticketType)
    const ticket = await Ticket.createTicket(event._id, owner._id, barcode, 1000, ticketType)

    await Transfer.create({
      date: Date.now(),
      senderId: owner._id,
      recieverId: reciever._id,
      ticketId: ticket._id,
      eventId: event._id
    })

    const mockReq = httpMocks.createRequest({
      method: 'get',
      url: `/transfers?eventId=${event._id}`,
      params: {
        id: event._id
      }
    })

    _set(mockReq, 'props.user', owner)
    const mockRes = httpMocks.createResponse()
    await TransfersInterface.routes['/transfers'].get(mockReq, mockRes)
    const actualResponseBody = mockRes._getData()
    const transfer = actualResponseBody[0]
    expect(transfer.senderId._id).toEqual(owner._id)
  }, 20000)
})
