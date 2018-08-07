const { mongoose } = require('../_utils/bootstrap')

import Ticket from '../tickets/controller'
import User from '../users/controller'
import Event from '../events/controller'
import Integrations from '../integrations'
import { _set, _get } from '.'

export function requireUser(req, res) {
  if (!req.props.user) return res.sendStatus(401)
}

export async function requireTicketOwner(req, res) {
  const { id } = req.params
  if (!id) res.status(422).send('Missing Ticket ID')

  requireUser(req, res)
  if (res.headersSent) return

  const { user } = req.props

  const isUser = await User.getUserById(user._id)
  if (!isUser) return res.status(404).send('User not found')

  const ticket = await Ticket.getTicketById(id)
  if (!ticket) return res.status(404).send('Ticket not found')

  console.log('String(ticket.ownerId) !== String(user._id): ', String(ticket.ownerId._id) !== String(user._id))
  console.log(String(ticket.ownerId._id))
  console.log(String(user._id))

  if (String(ticket.ownerId._id) !== String(user._id)) return res.status(401).send('Unauthorized')
}

export async function queryCollection(collection, query) {
  let entries = await new Promise((resolve, reject) => {
    let docs = []
    const Collection = mongoose.connection.collection(collection)
    Collection.find(query).on('data', (doc) => {
      docs.push(doc)
    }).on('end', () => {
      resolve(docs)
    }).on('error', reject)
  })
  return entries
}

export function convertQuery(query, req) {
  const normalizedQuery = {}
  for (let val in query) {
    const path = query[val]
    let queryParam = _get(req, path)
    if (mongoose.Types.ObjectId.isValid(queryParam)) {
      queryParam = mongoose.Types.ObjectId(queryParam)
    }
    normalizedQuery[val] = queryParam
  }
  return normalizedQuery
}

export function definePropFromDb({ prop, findOne }) {
  const { collection, query } = findOne
  return async(req, res) => {
    const normalizedQuery = convertQuery(query, req)
    let entries = await queryCollection(collection, normalizedQuery)
    entries = entries.length === 1 ? entries[0] : entries
    if (entries === null || entries.length === 0) return res.status(404).send(`${prop} not found`)
    _set(req, `props.${prop}`, entries)
  }
}



export function defineIntegration({ prop, findOne }) {
  return async(req, res) => {
    const { query, collection } = findOne
    const cQuery = convertQuery(query, req)
    const docs = await queryCollection(collection, cQuery)
    let doc = docs[0] // grab first event
    if (collection === 'tickets') doc = await Event.findEventById(doc.eventId)
    const { integrationType } = doc
    if (!Integrations[integrationType]) return res.status(404).send(`Unrecognized integration (${integrationType})`)
    const Integration = Integrations[integrationType].integration
    _set(req, `props.${prop}`, Integration)
  }
}


// export function defineUser({ prop, findOne }) {
//   return async(req, res) => {
//     const query = convertQuery(findOne, req)
//     const event = await Event.findOne({ urlSafe: req.params.urlSafe })
//
//     const { integrationType } = event
//     if (!Integrations[integrationType]) return res.status(404).send(`Invalid integration type (${integrationType})`)
//     const Integration = Integrations[integrationType].integration
//     const isValidTicket = await Integration.isValidTicket(query.barcode, event)
//     if (!isValidTicket) return res.status(404).send('Invalid Ticket ID')
//     _set(req, `props.${prop}`, Integration)
//   }
// }

//
// export function requireCreateUser(path) {
//   return async(req, res) => {
//     if (!req.props.user) {
//       const transferToEmail = _get(req, path)
//       const user = await User.createUser(transferToEmail, `${Math.random()}`)
//       if (!user) return res.status(409)send('Username already taken')
//       const passwordChangeUrl = await User.requestChangePasswordUrl(transferToEmail)
//       req.props.user = user
//       req.passwordChangeUrl = passwordChangeUrl
//     }
//   }
// }
