export default (tickets) => {
  let isArray = Array.isArray(tickets)
  if (!isArray) tickets = [tickets]
  let santatizedTickets = []
  for (let ticket of tickets) {
    ticket.barcode = null
    santatizedTickets.push(ticket)
  }
  return isArray ? santatizedTickets : santatizedTickets[0]
}
