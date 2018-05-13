import Payouts from './controller'

function checkAdminEmail(email) {
  const authEmails = JSON.parse(process.env.PAYOUT_AUTH_EMAILS)
  return ~authEmails.indexOf(email)
}

export default {
  ['/payouts']: { // this shouldn't be used, we should return tickets with the user
    get: {
      handler: async(req, res) => {
        const { user } = req.props
        const isAdmin = checkAdminEmail(user.email)
        if (!isAdmin) return res.status(401).send({ error: 'unauthorized' })
        const payouts = await Payouts.find({ isPaid: false })
        res.send(payouts)
      }
    }
  },
  ['/payouts/:id/isPaid']: {
    put: {
      handler: async(req, res) => {
        const { user } = req.props
        const { id } = req.params
        const isAdmin = checkAdminEmail(user.email)
        if (!isAdmin) return res.status(401).send({ error: 'unauthorized' })
        const payout = await Payouts.setIsPaidById(id)
        res.send(payout)
      }
    }
  }
}
