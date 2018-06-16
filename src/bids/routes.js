import url from 'url'
import Bid from './controller'
import { definePropFromDb } from '../_utils/route-middleware'
// import Ticket from '../tickets/controller'

export default {
  ['/:urlSafe/bids']: {
    post: {
      middleware: [
        definePropFromDb({
          prop: 'event',
          findOne: {
            collection: 'events',
            query: { urlSafe: 'params.urlSafe' }
          }
        })
      ],
      body: {
        price: Number,
        ticketType: String,
        stripeToken: String
      },
      handler: async(req, res) => {
        const { user, event } = req.props
        const { price, ticketType } = req.body
        if (!user) return res.status(403).send('User must be logged in to place a bid')


        // get all tickets of ticket type

        // const savedReserveToken = await redis.get('reserve-token', ticketId)
        // if (savedReserveToken)

        // if Ticket.find({ eventId: , price >= price,  }) then buy it

        const bids = await Bid.place(user._id, { price, ticketType })
        res.send(bids)
      }
    },
    get: {
      handler: async(req, res) => {
        const urlParts = url.parse(req.url, true)
        const query = urlParts.query
        const bids = await Bid.find(query)
        res.send(bids)
      }
    }
  }
}
