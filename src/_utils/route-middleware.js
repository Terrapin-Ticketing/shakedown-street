import Ticket from '../tickets/controller'
import User from '../users/controller'
import jwt from 'jsonwebtoken'
import config from 'config'
// import Integrations from '../events/integrations'
import { _get } from '.'

export function requireUser(req, res) {
  if (!req.user) return res.sendStatus(401)
}

export async function requireTicketOwner(req, res) {
  const { id } = req.params
  if (!id) res.send({ error: 'missing ticket id' })

  requireUser(req, res)
  if (res.headersSent) return

  const { user } = req

  const isUser = await User.getUserById(user._id)
  if (!isUser) return res.send({ error: 'user not found' })

  const ticket = await Ticket.getTicketById(id)
  if (!ticket) return res.send({ error: 'ticket not found' })

  if (String(ticket.ownerId) !== String(user._id)) return res.send({ error: 'unauthorized' })
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
//     if (!req.user) {
//       const transferToEmail = _get(req, path)
//       const user = await User.createUser(transferToEmail, `${Math.random()}`)
//       if (!user) return res.send({ error: 'username already taken' })
//       const passwordChangeUrl = await User.requestChangePasswordUrl(transferToEmail)
//       req.user = user
//       req.passwordChangeUrl = passwordChangeUrl
//     }
//   }
// }
