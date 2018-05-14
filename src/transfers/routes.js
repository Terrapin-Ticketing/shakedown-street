import url from 'url'
import Transfer from './controller'

function checkAdminEmail(email) {
  const authEmails = JSON.parse(process.env.PAYOUT_AUTH_EMAILS)
  return ~authEmails.indexOf(email)
}

export default {
  ['/transfers']: { // this shouldn't be used, we should return tickets with the user
    get: {
      handler: async(req, res) => {
        const { user } = req.props
        const isAdmin = checkAdminEmail(user.email)
        if (!isAdmin) return res.status(401).send({ error: 'unauthorized' })

        const urlParts = url.parse(req.url, true)
        const query = urlParts.query

        const transfers = await Transfer.find(query)
        res.send(transfers)
      }
    }
  }
}