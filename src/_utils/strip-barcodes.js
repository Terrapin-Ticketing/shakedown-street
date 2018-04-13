export default (tickets) => {
  let santatizedTickets = []
  for (let ticket of tickets) {
    ticket.barcode = null
    santatizedTickets.push(ticket)
  }
  return santatizedTickets
}
