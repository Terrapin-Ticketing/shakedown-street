// CheckoutForm.js
import React from 'react';
import Price from '../Price';

import './Order.scss';

class Order extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      serviceFee: 100,
      cardFee: 100,
      total: undefined
    };
  }

  async componentDidMount() {

  }

  calculateTotal() {
    let { order } = this.props;
    let { cardFee, serviceFee } = this.state;
    let total = order.reduce((total, ticket) => total + ticket.price);
    return total.price + (cardFee + serviceFee);
  }

  calculateCardFee(fees) {
    let { order } = this.props;
    return (event.price * order.ticketQty) + fees;
  }

  renderTickets() {
    let { order } = this.props;
    return order.map((ticket, index) => {
      return (
        <tr key={index} className="order-details-rows">
          <td className="name-column">
            { ticket.eventId.name } <br />
            { ticket.type }
          </td>
          <td></td>
          <td className="price"><Price price={ticket.price} /></td>
        </tr>
      )
    })
  }

  render() {
    let { order } = this.props;
    let { serviceFee, cardFee, total } = this.state;
    return (
        <div className="order-details card-content col s12 l6">
          <h2>Order Details</h2>
          <div className="order-box">
            <table className="order-table bordered">
              <thead>
                <tr className="order-details-header">
                  <th className="name-column">Event</th>
                  {/* <th>Quantity</th> */}
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {order.map((ticket, index) => {
                  return (
                    <tr key={index} className="order-details-rows">
                      <td className="name-column">
                        { ticket.eventId.name } <br />
                        { ticket.type }
                      </td>
                      {/* <td></td> */}
                      <td className="price"><Price price={ticket.price} /></td>
                    </tr>
                  )})}
                <tr className="service-fee"><td className="name-column">Service Fee</td><td><Price price={serviceFee} /></td></tr>
                <tr className="card-fee"><td className="name-column">Credit Card Processing</td><td><Price price={cardFee} /></td></tr>
                <tr className="total"><td className="name-column">Total:</td><td><Price price={this.calculateTotal()} /></td></tr>
              </tbody>
            </table>
          </div>
        </div>
    );
  }
}

export default Order;
