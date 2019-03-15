import url from 'url'
import Transfer from './controller'

function checkAdminEmail(email) {
  const authEmails = JSON.parse(process.env.PAYOUT_AUTH_EMAILS)
  return ~authEmails.indexOf(email)
}

export default {
  ['/transfers']: {
    get: {
      handler: async(req, res) => {
        const { user } = req.props
        if (!user) return res.status(401).send({ error: 'unauthorized' })
        const isAdmin = checkAdminEmail(user.email)
        if (!isAdmin) return res.status(401).send('Unauthorized')

        const urlParts = url.parse(req.url, true)
        const query = urlParts.query

        const transfers = await Transfer.find(query)
        res.send(transfers)
      }
    }
  }
}
