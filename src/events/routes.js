import url from 'url'
import Ticket from '../tickets/controller'
import User from '../users/controller'
import Emailer from '../email'
import Event from './controller'
import { Email } from '../_utils/param-validators'
import { definePropFromDb, defineIntegration } from '../_utils/route-middleware'

export default {
  ['/events']: {
    get: {
      handler: async(req, res) => {
        const urlParts = url.parse(req.url, true)
        const query = urlParts.query
        const events = await Event.find(query)
        res.send({ events })
      }
    }
  },
  ['/events/:id']: {
    get: {
      handler: async(req, res) => {
        let { id } = req.params
        let event = await Event.getEventById(id)
        res.send({ event })
      }
    }
  },
  ['/:urlSafe/validate']: {
    post: {
      middleware: [
        definePropFromDb({
          prop: 'event',
          findOne: {
            collection: 'events',
            query: { urlSafe: 'params.urlSafe' }
          }
        }),
        defineIntegration({
          prop: 'Integration',
          findOne: {
            collection: 'events',
            query: { urlSafe: 'params.urlSafe' }
          }
        })
      ],
      body: {
        barcode: String
      },
      handler: async(req, res) => {
        const { Integration, event } = req.props
        const { barcode } = req.body
        const isValidTicket = await Integration.isValidTicket(barcode, event)
        res.send({ isValidTicket })
      }
    }
  },
  ['/:urlSafe/activate']: {
    post: { // have to have this to have muiltiple routes under same name
      middleware: [
        definePropFromDb({
          prop: 'event',
          findOne: {
            collection: 'events',
            query: { urlSafe: 'params.urlSafe' }
          }
        }),
        defineIntegration({
          prop: 'Integration',
          findOne: {
            collection: 'events',
            query: { urlSafe: 'params.urlSafe' }
          }
        })
      ],
      body: {
        email: Email,
        barcode: String
      },
      handler: async(req, res) => {
        let { event, Integration } = req.props
        const { email, barcode } = req.body
        let user, passwordChangeUrl

        // get event
        const { _id, integrationType } = event
        const eventId = _id

        // check if ticket has already been activated
        const ticket = await Ticket.getTicketByBarcode(barcode)
        if (ticket) return res.status(400).send('This ticket has already been activated')

        const isValidTicket = await Integration.isValidTicket(barcode, event)
        if (!isValidTicket) return res.status(400).send('Invalid Ticket ID')

        // get user
        user = await User.getUserByEmail(email)
        if (!user) {
          user = await User.createUser(email, `${Math.random()}`)
          if (!user) return res.status(400).send('username already taken')
          passwordChangeUrl = await User.requestChangePasswordUrl(email)
        }
        let userId = user._id

        // get ticket info
        const ticketInfo = await Integration.getTicketInfo(barcode, event)
        if (!ticketInfo || !ticketInfo.type || isNaN(ticketInfo.price)) return res.status(400).send(`error getting ticket info from ${integrationType}`)
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
