import url from 'url'
import Ticket from './controller'
import User from '../users/controller'
import Event from '../events/controller'
import Emailer from '../email'
// import Integrations from '../integrations'
import stripBarcodes from '../_utils/strip-barcodes'
import { requireTicketOwner, defineIntegration/*, requireTicketIntegration, requireCreateUser*/ } from '../_utils/route-middleware'
import { Email } from '../_utils/param-validators'
import stripe from '../_utils/stripe'

export default {
  ['/tickets']: { // this shouldn't be used, we should return tickets with the user
    get: {
      handler: async(req, res) => {
        const urlParts = url.parse(req.url, true)
        const query = urlParts.query
        const tickets = await Ticket.find(query)
        const santatizedTickets = stripBarcodes(tickets)
        res.send(santatizedTickets)
      }
    }
  },
  ['/tickets/:id']: {
    get: {
      handler: async(req, res) => {
        const { id } = req.params
        const ticket = await Ticket.findOne({_id: id})
        if (!ticket) return res.status(404).send('ticket not found')
        res.send(stripBarcodes(ticket))
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
        if (!newTicket) return res.status(400).send('error updating ticket')
        res.send(newTicket)
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
        transferToEmail: Email // RequiredUser????
      },
      handler: async(req, res) => {
        let { user, Integration } = req.props
        const { transferToEmail } = req.body
        const { id } = req.params

        const ticket = await Ticket.getTicketById(id)

        let transferToUser = await User.getUserByEmail(transferToEmail)
        let createdNewUser = false
        let passwordChangeUrl
        if (!transferToUser) {
          transferToUser = await User.createUser(transferToEmail, `${Math.random()}`)
          if (!transferToUser) return res.status(400).send('username already taken')
          passwordChangeUrl = await User.requestChangePasswordUrl(transferToEmail)
          createdNewUser = true
        }

        // check ticket validity
        const newTicket = await Integration.transferTicket(ticket, transferToUser)
        if (!newTicket) return res.status(400).send('error transfering ticket')

        if (createdNewUser) {
          Emailer.sendNewUserTicketRecieved(transferToEmail, user.email, ticket, passwordChangeUrl)
        } else {
          Emailer.sendExistingUserTicketRecieved(transferToUser, ticket)
        }
        res.send(stripBarcodes(newTicket))
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
        transferToEmail: String
      },
      handler: async(req, res) => {
        let { user, Integration } = req.props
        const { id } = req.params
        const ticketId = id
        const { token, transferToEmail } = req.body
        const stripeToken = JSON.parse(token)
        // const { Integration, user, passwordChangeUrl } = req

        // check if ticket has already been activated or isn't for sale
        const ticket = await Ticket.getTicketById(ticketId)
        if (!ticket || !ticket.isForSale) return res.status(400).send('invalid ticket')

        // requireTicketIntegration
        const isValidTicket = await Integration.isValidTicket(ticket.barcode, ticket.event)
        if (!isValidTicket) return res.status(400).send('Invalid Ticket ID')

        // create user if one doesn't exist
        let passwordChangeUrl, charge
        if (!user) {
          user = await User.createUser(transferToEmail, `${Math.random()}`)
          if (!user) return res.status(400).send('username already taken')
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
          return res.status(400).send(e.message)
        }

        const newTicket = await Integration.transferTicket(ticket, user)
        if (!newTicket) return res.status(400).send('error tranfering ticket')

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
