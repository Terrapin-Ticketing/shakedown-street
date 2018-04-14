import config from 'config'
import Ticket from '../tickets/controller'
import User from '../users/controller'
import Emailer from '../email'
import Event from './controller'
import Integrations from '../integrations'
import { Email } from '../_utils/param-types'

export default {
  ['/events/:id']: {
    get: {
      handler: async(req, res) => {
        let { id } = req.params
        let event = await Event.getEventById(id)
        res.send({ event })
      }
    }
  },
  ['/events']: {
    post: {
      body: {
        event: Object
      },
      handler: async(req, res) => {
        let { event } = req.body
        // disable in production
        if (config.env === 'production') return res.sendStatus(500)

        let newEvent = await Event.createEvent(event)
        if (!newEvent) return res.send({ error: 'failed to save event' })
        res.send({ event: newEvent })
      }
    }
  },
  ['/:urlSafe/validate']: {
    post: {
      body: {
        barcode: String
      },
      handler: async(req, res) => {
        const { urlSafe } = req.params
        const { barcode } = req.body
        let ticket = await Ticket.getTicketByBarcode(barcode)
        if (ticket) return res.send({ error: 'This ticket has already been activated' })

        let event = await Event.getEventByUrlSafe(urlSafe)
        const { integrationType } = event

        if (!Integrations[integrationType]) return res.send({ error: `invalid integration type ${integrationType}` })
        const Integration = Integrations[integrationType].integration
        const isValidTicket = await Integration.isValidTicket(barcode, event)
        res.send({ isValidTicket })
      }
    }
  },
  ['/:urlSafe/activate']: {
    post: { // have to have this to have muiltiple routes under same name
      middleware: [/*requireCreateUser('body.email')*/],
      body: {
        email: Email,
        barcode: String
      },
      handler: async(req, res) => {
        const { urlSafe } = req.params
        const { email, barcode } = req.body
        let user, passwordChangeUrl

        // get event
        const event = await Event.getEventByUrlSafe(urlSafe)
        if (!event) return res.send({ error: 'invalid event' })
        const { _id, integrationType } = event
        const eventId = _id

        // check if ticket has already been activated
        const ticket = await Ticket.getTicketByBarcode(barcode)
        if (ticket) return res.send({ error: 'This ticket has already been activated' })

        // check ticket validity
        if (!Integrations[integrationType]) return res.send({ error: `invalid integration type ${integrationType}` })
        const Integration = Integrations[integrationType].integration
        const isValidTicket = await Integration.isValidTicket(barcode, event)
        if (!isValidTicket) return res.send({ error: 'Invalid Ticket ID' })

        // get user
        user = await User.getUserByEmail(email)
        if (!user) {
          user = await User.createUser(email, `${Math.random()}`)
          if (!user) return res.send({ error: 'username already taken' })
          passwordChangeUrl = await User.requestChangePasswordUrl(email)
        }
        let userId = user._id

        // get ticket info
        const ticketInfo = await Integration.getTicketInfo(barcode, event)
        if (!ticketInfo || !ticketInfo.type || ticketInfo.price !== 0) return res.send({ error: `error getting ticket info from ${integrationType}` })
        const { type, price } = ticketInfo

        // create new ticket
        const newTicket = await Ticket.createTicket(eventId, userId, barcode, price, type)

        Emailer.sendTicketActivated(user, newTicket)

        res.send({
          ticket: newTicket,
          passwordChangeUrl
        })
      }
    }
  }
}
