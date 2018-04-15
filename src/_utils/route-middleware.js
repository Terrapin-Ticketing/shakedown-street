const { mongoose } = require('../_utils/bootstrap')

import Ticket from '../tickets/controller'
import User from '../users/controller'
// import Integrations from '../integrations'
import { _set, _get } from '.'

export function requireUser(req, res) {
  if (!req.props.user) return res.sendStatus(401)
}

export async function requireTicketOwner(req, res) {
  const { id } = req.params
  if (!id) res.send({ error: 'missing ticket id' })

  requireUser(req, res)
  if (res.headersSent) return

  const { user } = req.props

  const isUser = await User.getUserById(user._id)
  if (!isUser) return res.send({ error: 'user not found' })

  const ticket = await Ticket.getTicketById(id)
  if (!ticket) return res.send({ error: 'ticket not found' })

  if (String(ticket.ownerId) !== String(user._id)) return res.send({ error: 'unauthorized' })
}

export function requireValidObject({ collection, query, propName, multi=false }) {
  return async(req, res) => {
    const Collection = mongoose.connection.collection(collection)
    const normalizedQuery = {}
    for (let val in query) {
      const path = query[val]
      const queryParam = _get(req, path)
      normalizedQuery[val] = queryParam
    }

    let entries
    if (multi) {
      entries = await new Promise((resolve, reject) => {
        let docs = []
        Collection.find(normalizedQuery).on('data', (doc) => {
          docs.push(doc)
        }).on('end', () => {
          resolve(docs)
        }).on('error', reject)
      })
    } else {
      entries = await Collection.findOne(normalizedQuery)
    }


    if (entries === null || entries.length === 0) return res.send({ error: `${propName} not found` })
    _set(req, `props.${propName}`, entries)
  }
}

// export function requireTicketIntegration(config) {
//   return async(req, res) => {
//     const identifier = _get(req, config.path)
//     const ticket = await Ticket.find({ [config.lookupBy]: identifier })
//     console.log('ticket:', ticket);
//     const { integrationType } = ticket.event
//     if (!Integrations[ticket.event.integrationType]) return res.send({ error: `invalid integration type ${integrationType}` })
//     const Integration = Integrations[integrationType].integration
//     const isValidTicket = await Integration.isValidTicket(ticket.barcode, event)
//     if (!isValidTicket) return res.send({ error: 'Invalid Ticket ID' })
//     req.Integration
//   }
// }
//
// export function requireCreateUser(path) {
//   return async(req, res) => {
//     if (!req.props.user) {
//       const transferToEmail = _get(req, path)
//       const user = await User.createUser(transferToEmail, `${Math.random()}`)
//       if (!user) return res.send({ error: 'username already taken' })
//       const passwordChangeUrl = await User.requestChangePasswordUrl(transferToEmail)
//       req.props.user = user
//       req.passwordChangeUrl = passwordChangeUrl
//     }
//   }
// }
