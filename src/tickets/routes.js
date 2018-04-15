import url from 'url'
import Ticket from './controller'
import User from '../users/controller'
import Event from '../events/controller'
import Emailer from '../email'
import Integrations from '../integrations'
import stripBarcodes from '../_utils/strip-barcodes'
import { requireTicketOwner/*, requireTicketIntegration, requireCreateUser*/ } from '../_utils/route-middleware'
import { Email } from '../_utils/param-types'
import stripe from '../_utils/stripe'

export default {
  ['/tickets']: { // this shouldn't be used, we should return tickets with the user
    get: {
      handler: async(req, res) => {
        const urlParts = url.parse(req.url, true)
        const query = urlParts.query
        const tickets = await Ticket.find(query)
        const santatizedTickets = stripBarcodes(tickets)
        res.send({ tickets: santatizedTickets })
      }
    }
  },
  ['/tickets/:id']: {
    get: {
      handler: async(req, res) => {
        const { id } = req.params
        const ticket = await Ticket.findOne({_id: id})
        if (!ticket) return res.send({ error: 'ticket not found' })
        res.send({ ticket: stripBarcodes(ticket) })
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
  ['/tickets/:id/transfer']: {
    post: {
      middleware: [requireTicketOwner],
      body: {
        transferToEmail: Email
      },
      handler: async(req, res) => {
        let { user } = req.props
        const { transferToEmail } = req.body
        const { id } = req.params

        const ticket = await Ticket.getTicketById(id)

        let transferToUser = await User.getUserByEmail(transferToEmail)
        let createdNewUser = false
        let passwordChangeUrl
        if (!transferToUser) {
          transferToUser = await User.createUser(transferToEmail, `${Math.random()}`)
          if (!transferToUser) res.send({ error: 'username already taken' })
          passwordChangeUrl = await User.requestChangePasswordUrl(transferToEmail)
          createdNewUser = true
        }

        // get event
        const event = await Event.getEventById(ticket.eventId)
        if (!event) return res.send({ error: 'invalid event' })
        const { integrationType } = event

        // check ticket validity
        if (!Integrations[integrationType]) return res.send({ error: `invalid integration type ${integrationType}` })
        const Integration = Integrations[integrationType].integration
        const newTicket = await Integration.transferTicket(ticket, transferToUser)
        if (!newTicket) return res.send({ error: 'error transfering ticket' })

        if (createdNewUser) {
          Emailer.sendNewUserTicketRecieved(transferToEmail, user.email, ticket, passwordChangeUrl)
        } else {
          Emailer.sendExistingUserTicketRecieved(transferToUser, ticket)
        }
        res.send({ ticket: stripBarcodes(newTicket) })
      }
    }
  },
  ['/payment/:id']: {
    post: {
      // middleware: [ /*requireTicketIntegration({path: 'body.token', mapTo: 'Integration'}), requireCreateUser('body.transferToEmail')*/ ],
      body: {
        token: String,
        transferToEmail: String
      },
      handler: async(req, res) => {
        const { id } = req.params
        const ticketId = id
        const { token, transferToEmail } = req.body
        const stripeToken = JSON.parse(token)
        // const { Integration, user, passwordChangeUrl } = req

        // check if ticket has already been activated or isn't for sale
        const ticket = await Ticket.getTicketById(ticketId)
        if (!ticket || !ticket.isForSale) return res.send({ error: 'invalid ticket' })

        const { integrationType } = ticket.event
        // requireTicketIntegration
        if (!Integrations[ticket.event.integrationType]) return res.send({ error: `invalid integration type ${integrationType}` })
        const Integration = Integrations[integrationType].integration
        const isValidTicket = await Integration.isValidTicket(ticket.barcode, ticket.event)
        if (!isValidTicket) return res.send({ error: 'Invalid Ticket ID' })

        // create user if one doesn't exist
        let user = req.props.user
        let passwordChangeUrl, charge
        if (!user) {
          user = await User.createUser(transferToEmail, `${Math.random()}`)
          if (!user) return res.send({ error: 'username already taken' })
          passwordChangeUrl = await User.requestChangePasswordUrl(transferToEmail)
        }

        const originalOwner = await User.getUserById(ticket.ownerId)

        // calculate total
        let event = await Event.getEventById(ticket.event)
        let serviceFee = ticket.price * event.totalMarkupPercent
        let baseTotal = serviceFee + ticket.price
        let stripeTotal = (baseTotal * 0.029) + 50
        let total = Math.ceil(baseTotal + stripeTotal)

        try {
          charge = await stripe.createCharge(user, stripeToken, total)
        } catch (e) {
          return res.send({ error: e.message })
        }

        const newTicket = await Integration.transferTicket(ticket, user)
        if (!newTicket) return res.send({ error: 'error tranfering ticket' })

        // don't use 'await' here because we want to return immediately
        Emailer.sendSoldTicketEmail(originalOwner, newTicket)

        return res.send({
          charge,
          ticket: newTicket,
          passwordChangeUrl
        })
      }
    }
  }
}
