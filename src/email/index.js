import nodemailer from 'nodemailer'
import emailTemplates from './email.templates'
import config from 'config'
import moment from 'moment'

class Emailer {
  async sendChangePassword(toEmail, passwordChangeUrl) {
    let topText = 'Use this link to reset your password.'
    let emailHTML = (`
      <tr>
        <td valign="top" class="bodyContent" mc:edit="body_content00">
            <h1>Reset Password</h1>
            <p>You recently requested to reset your password for your Terrapin Ticketing account. Use the button below to reset it.</p>
            <div style="text-align: center">
              <a href="${passwordChangeUrl}" class="btn">Reset Password</a>
            </div>

            <p>If you did not request a password reset, please ignore this email or <a href="mailto:info@terrapinticketing.com">contact support</a> if you have questions.</p>

            <p>Cheers,<br />
            The Terrapin Ticketing Team</p>

            <hr />

            <p class="subtext">If you’re having trouble with the button above, copy and paste the URL below into your web browser. <br />
            ${passwordChangeUrl}</p>
      </td>
      </tr>
    `)
    const mailOptions = {
      from: 'Terrapin Ticketing <info@terrapinticketing.com>', // sender address
      to: toEmail, // list of receivers
      subject: 'Forgot Password', // Subject line
      html: await formatEmail(emailHTML, topText)
    }

    return await sendMail(mailOptions)
  }

  async sendNewUserTicketRecieved(toEmail, fromUser, ticket, passwordChangeUrl) {
    let topText = 'You were transfered a ticket on Terrapin Ticketing.'
    let emailHTML = (`
          <tr>
              <td valign="top" class="bodyContent" mc:edit="body_content00">
                  <h1>You received a tickett</h1>
                  ${fromUser} transfered a ${ticket.event.name} to your Terrapin Ticketing account. <br /><br />

                  <div style="text-align: center;">
                    <a href="${passwordChangeUrl}" class="btn">View it Here</a>
                  </div><br />
                  <small>If you are unable to click the button above, copy and paste this link into your browser: ${passwordChangeUrl}</small>
              </td>
          </tr>
          ${getTicketCard(ticket, config)}
    `)

    const mailOptions = {
      from: 'Terrapin Ticketing <info@terrapinticketing.com>', // sender address
      to: toEmail, // list of receivers
      subject: `You're going to ${ticket.event.name}!`, // Subject line
      html: await formatEmail(emailHTML, topText)
    }


    return await sendMail(mailOptions)
  }

  async sendExistingUserTicketRecieved(user, ticket) {
    let topText = 'Someone transfered you a ticket on Terrapin Ticketing.'
    let emailHTML = (`
          <tr>
              <td valign="top" class="bodyContent" mc:edit="body_content00">
                  <h1>You received a ticket</h1>
                  <br />
                  You received a ticket to ${ticket.event.name}. <br /><br />
                  <div style="text-align: center">
                    <a href="${`${config.clientDomain}/event/${ticket.event._id}/ticket/${ticket._id}`}" class="btn">View it Here</a>
                  </div><br />
                  <small>If you are unable to click the button above, copy and paste this link into your browser: ${`${config.clientDomain}/event/${ticket.event._id}/ticket/${ticket._id}`}</small>
              </td>
          </tr>
          ${getTicketCard(ticket, config)}
    `)
    const mailOptions = {
      from: 'Terrapin Ticketing <info@terrapinticketing.com>', // sender address
      to: user.email, // list of receivers
      subject: `You're going to ${ticket.event.name}!`, // Subject line
      html: await formatEmail(emailHTML, topText)
    }

    return await sendMail(mailOptions)
  }

  async sendTicketActivated(user, ticket) {
    let topText = `You activated your ${ticket.event.name} ticket`
    let emailHTML = (`
          <tr>
              <td valign="top" class="bodyContent" mc:edit="body_content00">
                  <h1>You activated a ticket</h1>
                  <br />
                  You activated a ticket to ${ticket.event.name}. <br /><br />
                  <div style="text-align: center">
                    <a href="${`${config.clientDomain}/event/${ticket.event._id}/ticket/${ticket._id}`}" class="btn">View it Here</a>
                  </div><br />
                  <small>If you are unable to click the button above, copy and paste this link into your browser: ${`${config.clientDomain}/event/${ticket.event._id}/ticket/${ticket._id}`}</small>
              </td>
          </tr>
          <tr>
              <td valign="top" class="bodyContent" mc:edit="body_content00">
                  Now that your ticket is activated on Terrapin, you can mark it as for sale, transfer it to other fans, or store it in your Terrapin wallet to pull up whle in line to get into the show.
              </td>
          </tr>
          ${getTicketCard(ticket, config)}
    `)
    const mailOptions = {
      from: 'Terrapin Ticketing <info@terrapinticketing.com>', // sender address
      to: user.email, // list of receivers
      subject: `You activated a ticket to ${ticket.event.name}!`, // Subject line
      html: await formatEmail(emailHTML, topText)
    }

    return await sendMail(mailOptions)
  }


  async sendSoldTicketEmail(user, ticket) {
    let topText = `Someone bought your ticket to ${ticket.event.name}!`
    let emailHTML = (`
      <tr>
          <td valign="top" class="bodyContent" mc:edit="body_content00">
              <h1>Your ticket sold!</h1>
              <br />
              Your ticket for ${ticket.event.name} sold on Terrapin Ticketing.
              <br /><br />
              You will receive ${displayPrice(ticket.price)} in your ${user.payout.default && user.payout[user.payout.default]} account on ${user.payout.default && user.payout.default.charAt(0).toUpperCase()}${user.payout.default && user.payout.default.slice(1)} in the next 24 hours. <br /><br />
              If you have any questions, please email info@terrapinticketing.com
              <br /><br />
              <p>Cheers,<br />
              The Terrapin Ticketing Team</p>
          </td>
      </tr>
    `)
    const mailOptions = {
      from: 'Terrapin Ticketing <info@terrapinticketing.com>', // sender address
      to: user.email, // list of receivers
      subject: 'You sold your ticket!', // Subject line
      html: await formatEmail(emailHTML, topText)
    }

    return await sendMail(mailOptions)
  }

  async emailTicketIsForSale(user, ticket) {
    let topText = `Your ticket to ${ticket.event.name} is ${(ticket.isForSale) ? 'for sale' : 'no longer for sale'}!`
    let emailHTML = (`
      <tr>
          <td valign="top" class="bodyContent" mc:edit="body_content00">
              <h1>${(ticket.isForSale) ? 'Congrats, your ticket is now for sale!' : 'Second thoughts?'}</h1>
              <br />
              Your ticket to ${ticket.event.name} is <b>${(ticket.isForSale) ? 'marked for sale' : 'no longer for sale'}</b> on Terrapin Ticketing.
              <br /><br />
              ${(ticket.isForSale) ? `Share this link around so other people can buy it: <span style="break-word: normal">${config.clientDomain}/event/${ticket.event._id}/ticket/${ticket._id}</span> <br /><br />
              We will send ${displayPrice(ticket.price)} to ${user.payout[user.payout.default]} via ${user.payout.default.charAt(0).toUpperCase() + user.payout.default.slice(1)} once someone else buys it. <br /><br />` : ''}

              If you have any questions, please email info@terrapinticketing.com
              <br /><br />
              <p>Cheers,<br />
              The Terrapin Ticketing Team</p>
          </td>
      </tr>
    `)
    const mailOptions = {
      from: 'Terrapin Ticketing <info@terrapinticketing.com>', // sender address
      to: user.email, // list of receivers
      subject: `${(ticket.isForSale) ? 'Your ticket is for sale!' : 'Your ticket is no longer for sale!'}`, // Subject line
      html: await formatEmail(emailHTML, topText)
    }

    return await sendMail(mailOptions)
  }

  async emailPurchaseTicket(user, ticket) {
    let topText = `This is a receipt for your recent purchase on ${moment().format('MMMM Do YYYY')}. No payment is due with this receipt.`
    let emailHTML = (`
          <tr>
              <td valign="top" class="bodyContent" mc:edit="body_content00">
                  <h1>You purchased a ticket</h1>
                  <br />
                  Thanks for using Terrapin Ticketing. This email is the receipt for your purchase. No payment is due.
              </td>
          </tr>
          ${getOrderCard(ticket)}
          ${getTicketCard(ticket, config)}
    `)
    const mailOptions = {
      from: 'Terrapin Ticketing <info@terrapinticketing.com>', // sender address
      to: user.email, // list of receivers
      subject: `Purchase Receipt: ${ticket.event.name}!`, // Subject line
      html: await formatEmail(emailHTML, topText)
    }

    return await sendMail(mailOptions)
  }

}

export default new Emailer()

function getOrderCard(ticket) {
  let serviceFee = ticket.price * ticket.event.totalMarkupPercent
  let baseTotal = serviceFee + ticket.price

  let stripeTotal = (baseTotal * 0.029) + 50

  let total = Math.ceil(baseTotal + stripeTotal)
  return (`
    <tr>
      <td valign="top" class="bodyContent">
          <h2>Order Details</h2>
          <div class="order-box">
            <table class="order-table bordered">
              <thead>
                <tr class="order-details-header">
                  <th class="name-column order">Event</th>
                  <th class="order">Price</th>
                </tr>
              </thead>
              <tbody>
                <tr class="order-details-rows">
                  <td class="name-column">
                    ${ ticket.event.name } <br />
                    ${ ticket.type }
                  </td>
                  <td class="price">${displayPrice(ticket.price)}</td>
                </tr>
                <tr class="service-fee"><td class="name-column">Service Fee</td><td>${displayPrice(serviceFee)}</td></tr>
                <tr class="card-fee"><td class="name-column">Credit Card Processing</td><td>${displayPrice(stripeTotal)}</td></tr>
                <tr class="total"><td class="name-column">Total:</td><td>${displayPrice(total)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </td>
    </tr>
  `)
}


function getTicketCard(ticket, config) {
  return (`
    <tr>
        <td align="center" valign="top">
            <!-- BEGIN COLUMNS // -->
              <table border="0" cellpadding="20" cellspacing="0" width="100%" id="templateColumns">
                <tr mc:repeatable>
                    <td align="left" valign="top" style="padding-bottom:0;">
                        <table align="left" border="0" cellpadding="0" cellspacing="0" class="templateColumnContainer">
                            <tr>
                              <h2>Ticket Information</h2>
                                <td class="leftColumnContent">
                                    <img src="${ticket.event.imageUrl}" style="max-width:260px;" class="columnImage" mc:label="left_column_image" mc:edit="left_column_image" />
                                  </td>
                              </tr>
                          </table>
                        <table align="right" border="0" cellpadding="0" cellspacing="0" class="templateColumnContainer">
                              <tr>
                                <td valign="top" class="rightColumnContent" mc:edit="right_column_content">
                                      <h3>${ticket.event.name}</h3>
                                      ${ticket.type} <br /><br />
                                      <span>${ticket.event.date}</span> <br /><br />
                                      ${ticket.event.venue.name} <br />
                                      ${ticket.event.venue.address} <br />
                                      ${ticket.event.venue.city}, ${ticket.event.venue.state} ${ticket.event.venue.zip}
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <div class="card-action">
                                    <a class="btn-flat waves-effect" href=${`${config.clientDomain}/event/${ticket.event._id}/ticket/${ticket._id}`}>View</a>
                                    <a class="btn-flat waves-effect" href=${`${config.clientDomain}/my-profile`}>Sell</a>
                                    <a class="btn-flat waves-effect" href=${`${config.clientDomain}/my-profile`}>Transfer</a>
                                    <!-- <a class="btn-flat waves-effect">History</a> -->
                                  </div>
                                 </td>
                              </tr>
                          </table>
                      </td>
                  </tr>
              </table>
              <!-- // END COLUMNS -->
          </td>
      </tr>
  `)
}

async function formatEmail(emailHTML, topText) {
  return await emailTemplates(emailHTML, topText)
}

let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'info@terrapinticketing.com',
    pass: config.infopass
  }
})

async function sendMail(mailOptions) {
  if (process.env.NODE_ENV === 'test') return
  return await new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, function(err, info) {
      if (err) return reject(err)
      resolve(info)
    })
  })
}

function displayPrice(price) {
  return (`$${parseFloat(price / 100.0).toFixed(2)}`)
}
