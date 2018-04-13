import url from 'url'
import Ticket from './controller'
import User from '../users/controller'
import Emailer from '../users/email'
import Integrations from '../events/integrations'
import stripBarcodes from '../_utils/strip-barcodes'
import { isEmptyObject } from '../_utils'
import { requireTicketOwner/*, requireTicketIntegration, requireCreateUser*/ } from '../_utils/route-middleware'
import { Email } from '../_utils/param-types'
import stripe from '../_utils/stripe'

export default {
  ['/tickets']: { // this shouldn't be used, we should return tickets with the user
    get: {
      handler: async(req, res) => {
        const urlParts = url.parse(req.url, true)
        const query = urlParts.query
        if (isEmptyObject(query)) res.send({}) // we shouldn't allow system wide ticket retreival
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
  ['/tickets/:id/transfer']: {
    post: {
      middleware: [requireTicketOwner],
      body: {
        transferToEmail: Email
      },
      handler: async(req, res) => {
        let { user } = req
        const { transferToEmail } = req.body
        const { id } = req.params

        const ticket = await Ticket.getTicketById(id)

        let transferToUser = await User.getUserById(user._id)
        let createdNewUser = false
        let passwordChangeUrl
        if (!transferToUser) {
          transferToUser = await User.createUser(transferToEmail, `${Math.random()}`)
          passwordChangeUrl = await User.requestChangePasswordUrl(transferToUser)
          createdNewUser = true
        }

        const Integration = Integrations[ticket.integrationType]
        const newTicket = await Integration.transferTicket(ticket, transferToUser, user)
        if (!newTicket) return res.send({ error: 'error transfering ticket' })

        if (createdNewUser) {
          Emailer.sendNewUserTicketRecieved(transferToEmail, user.email, ticket, passwordChangeUrl)
        } else {
          Emailer.sendExistingUserTicketRecieved(transferToUser, ticket)
        }
        res.send({ ticket: newTicket })
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
        const stripeToken = token

        // const { Integration, user, passwordChangeUrl } = req

        // check if ticket has already been activated or isn't for sale
        const ticket = await Ticket.getTicketById(ticketId)
        if (!ticket || !ticket.isForSale) return res.send({ error: 'invalid ticket' })

        const { integrationType } = ticket.event
        // requireTicketIntegration
        if (!Integrations[ticket.event.integrationType]) return res.send({ error: `invalid integration type ${integrationType}` })
        const Integration = Integrations[integrationType].integration
        const isValidTicket = await Integration.isValidTicket(ticket.barcode, event)
        if (!isValidTicket) return res.send({ error: 'Invalid Ticket ID' })


        // create user if one doesn't exist
        // requireCreateUser
        let user = req.user
        let passwordChangeUrl, charge
        if (!user) {
          user = await User.createUser(transferToEmail, `${Math.random()}`)
          if (!user) return res.send({ error: 'username already taken' })
          passwordChangeUrl = await User.requestChangePasswordUrl(transferToEmail)
        }

        const originalOwner = User.getUserById(ticket.ownerId)

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

        const newTicket = Integration.transferTicket(ticket, user)

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
