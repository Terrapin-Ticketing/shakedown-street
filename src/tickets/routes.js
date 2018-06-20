import url from 'url'
import uuidv1 from 'uuid/v4'
import Ticket from './controller'
import User from '../users/controller'
import Event from '../events/controller'
import Payout from '../payouts/controller'
import Emailer from '../email'

// import Integrations from '../integrations'
import stripBarcodes from '../_utils/strip-barcodes'
import { requireTicketOwner, defineIntegration/*, requireTicketIntegration, requireCreateUser*/ } from '../_utils/route-middleware'
import stripe from '../_utils/stripe'
import redis from '../_utils/redis'

import Transfer from '../transfers/controller'

export default {
  ['/tickets']: {
    get: {
      handler: async(req, res) => {
        const { user } = req.props
        const urlParts = url.parse(req.url, true)
        const query = urlParts.query
        let tickets = await Ticket.find(query)
        // strip barcodes off tickets if not called by owner
        tickets = tickets.map((ticket) => {
          if (!user || String(ticket.ownerId) !== String(user._id)) {
            return stripBarcodes(ticket)
          }
          return ticket
        })
        res.send({ tickets })
      }
    }
  },
  ['/tickets/available']: {
    get: {
      handler: async(req, res) => {
        const { user } = req.props
        const urlParts = url.parse(req.url, true)
        const query = urlParts.query
        let tickets = await Ticket.find(query)
        // strip barcodes off tickets if not called by owner
        tickets = tickets.map((ticket) => {
          if (!user || String(ticket.ownerId) !== String(user._id)) {
            return stripBarcodes(ticket)
          }
          return ticket
        })
        // remove all reserved tickets (.filter dosn't support promises)
        const availableTickets = []
        for (let ticket of tickets) {
          const reserveToken = await redis.get('reserve-token', ticket._id)
          if (!reserveToken) {
            availableTickets.push(ticket)
          }
        }
        res.send({ tickets: availableTickets })
      }
    }
  },
  ['/tickets/:id']: {
    get: {
      handler: async(req, res) => {
        const { user } = req.props
        const { id } = req.params
        let ticket = await Ticket.getTicketById(id)
        if (!ticket) return res.send({ error: 'ticket not found' })
        if (!user || String(ticket.ownerId) !== String(user._id)) {
          ticket = stripBarcodes(ticket)
        }
        res.send({ ticket })
      }
    },
    put: {
      middleware: [requireTicketOwner],
      handler: async(req, res) => {
        const { isForSale, price } = req.body
        const { id } = req.params

        const ticket = await Ticket.getTicketById(id)

        const newTicket = await Ticket.set(ticket._id, {
          isForSale,
          price
        })
        if (!newTicket) return res.send({ error: 'error updating ticket' })

        res.send({ ticket: newTicket })
      }
    }
  },
  ['/tickets/:id/reserve']: {
    get: {
      handler: async(req, res) => {
        const { id } = req.params
        const ticket = await Ticket.getTicketById(id)
        if (!ticket || !ticket.isForSale) return res.send({ error: 'unable to reserve ticket' })

        if (await redis.get('reserve-token', String(id))) return res.send({ error: 'ticket already reserved' })
        const reserveToken = uuidv1()
        // await redis.set('reserve-token', id, reserveToken, 10)
        await redis.set('reserve-token', String(id), reserveToken, 60*15)
        res.send({ticket, reserveToken})
      }
    },
    delete: {
      handler: async(req, res) => {
        const { id } = req.params
        const urlParts = url.parse(req.url, true)
        const query = urlParts.query
        const { reserveToken } = query
        const ticket = await Ticket.getTicketById(id)
        if (!ticket || !ticket.isForSale) return res.send({ error: 'unable to reserve ticket' })
        const savedToken = await redis.get('reserve-token', String(id))
        if (savedToken !== reserveToken) return res.status(401).send({ error: 'users cant remove token that they dont have access to' })
        await redis.set('reserve-token', String(id), false)
        res.send({ticket})
      }
    }
  },
  ['/tickets/:id/transfer']: {
    post: {
      middleware: [
        requireTicketOwner,
        defineIntegration({
          prop: 'Integration',
          findOne: {
            collection: 'tickets',
            query: { _id: 'params.id' }
          }
        })
      ],
      body: {
        transferToUser: Object
      },
      handler: async(req, res) => {
        let { user, Integration } = req.props
        const { transferToUser } = req.body
        const { id } = req.params

        const { email, firstName, lastName } = transferToUser

        const ticket = await Ticket.getTicketById(id)

        let existingUser = await User.getUserByEmail(email)
        let createdNewUser = false
        let passwordChangeUrl
        if (!existingUser) {
          existingUser = await User.createUser(email, `${Math.random()}`, firstName, lastName)
          if (!existingUser) return res.send({ error: 'username already taken' })
          passwordChangeUrl = await User.requestChangePasswordUrl(email)
          createdNewUser = true
        } else {
          existingUser = await User.set(existingUser._id, {
            firstName,
            lastName
          })
        }


        // check ticket validity
        const newTicket = await Integration.transferTicket(ticket, existingUser)
        if (!newTicket) return res.send({ error: 'error transfering ticket' })

        await Transfer.create({
          date: Date.now(),
          senderId: user._id,
          recieverId: existingUser._id,
          ticketId: ticket._id,
          eventId: ticket.eventId
        })

        if (createdNewUser) {
          Emailer.sendNewUserTicketRecieved(email, user.email, ticket, passwordChangeUrl)
        } else {
          Emailer.sendExistingUserTicketRecieved(existingUser, ticket)
        }
        res.send({ ticket: stripBarcodes(newTicket) })
      }
    }
  },
  ['/payment/:id']: {
    post: {
      middleware: [
        defineIntegration({
          prop: 'Integration',
          findOne: {
            collection: 'tickets',
            query: { _id: 'params.id' }
          }
        })
      ],
      body: {
        token: String,
        transferToUser: Object,
        reserveToken: String
      },
      handler: async(req, res) => {
        let { user, Integration } = req.props
        const { id } = req.params
        const ticketId = id
        const { token, transferToUser, reserveToken } = req.body
        const stripeToken = token

        const { email, firstName, lastName } = transferToUser

        const savedReserveToken = await redis.get('reserve-token', ticketId)
        if (reserveToken !== savedReserveToken) return res.send({ error: 'invalid reserve token' })

        // check if ticket has already been activated or isn't for sale
        const ticket = await Ticket.getTicketById(ticketId)
        if (!ticket || !ticket.isForSale) return res.send({ error: 'invalid ticket' })

        // requireTicketIntegration
        const isValidTicket = await Integration.isValidTicket(ticket.barcode, ticket.event)
        if (!isValidTicket) return res.send({ error: 'Invalid Ticket ID' })

        // create user if one doesn't exist
        let passwordChangeUrl, charge
        if (!user) {
          user = await User.createUser(email, `${Math.random()}`, firstName, lastName)
          if (!user) return res.send({ error: 'username already taken' })
          passwordChangeUrl = await User.requestChangePasswordUrl(email)
        } else {
          user = await User.set(user._id, {
            firstName,
            lastName
          })
        }

        const originalOwner = await User.getUserById(ticket.ownerId)

        // calculate total
        let event = await Event.getEventById(ticket.event)
        let serviceFee = ticket.price * event.totalMarkupPercent + event.totalStaticMarkup

        let baseTotal = serviceFee + ticket.price
        let stripeTotal = (baseTotal * 0.029) + 50
        let total = Math.ceil(baseTotal + stripeTotal)

        try {
          charge = await stripe.createCharge(user, stripeToken, total)
        } catch (e) {
          return res.send({ error: e.message })
        }
        const newTicket = await Integration.transferTicket(ticket, user)
        if (!newTicket) return res.send({ error: 'error buying ticket' })

        // don't use 'await' here because we want to return immediately
        Emailer.sendSoldTicketEmail(originalOwner, newTicket)
        await Payout.create({
          date: Date.now(),
          price: ticket.price,
          stripeChargeId: charge.id,
          ticketId: newTicket._id,
          sellerId: originalOwner._id,
          buyerId: user._id,
          eventId: event._id,
          isPaid: false
        })

        return res.send({
          charge,
          ticket: newTicket,
          passwordChangeUrl
        })
      }
    }
  }
}
