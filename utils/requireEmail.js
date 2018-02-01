import nodemailer from 'nodemailer';
import redis from 'redis';
import config from 'config';
import moment from 'moment';

const emailTemplates = require('./emailTemplates');

const notificationEmail = 'info@terrapinticketing.com';

const uuidv1 = require('uuid/v4');

let client = redis.createClient();

let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'info@terrapinticketing.com',
    pass: config.infopass
  }
});

async function sendMail(mailOptions) {
  return await new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, function(err, info) {
      if (err) return reject(err);
      resolve(info);
    });
  });
}

function formatEmail(emailHTML, topText) {
  return emailTemplates.default(emailHTML, topText);
}

function calculateTotal(ticketPrice, serviceFee, cardFee) {
  return ticketPrice + serviceFee + cardFee;
}

function displayPrice(price) {
  return (`$${parseFloat(price / 100.0).toFixed(2)}`);
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
                                    <img src="${ticket.eventId.imageUrl}" style="max-width:260px;" class="columnImage" mc:label="left_column_image" mc:edit="left_column_image" />
                                  </td>
                              </tr>
                          </table>
                        <table align="right" border="0" cellpadding="0" cellspacing="0" class="templateColumnContainer">
                              <tr>
                                <td valign="top" class="rightColumnContent" mc:edit="right_column_content">
                                      <h3>${ticket.eventId.name}</h3>
                                      ${ticket.type} <br /><br />
                                      <span>${ticket.eventId.date}</span> <br /><br />
                                      ${ticket.eventId.venue.name} <br />
                                      ${ticket.eventId.venue.address} <br />
                                      ${ticket.eventId.venue.city}, ${ticket.eventId.venue.state} ${ticket.eventId.venue.zip}
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <div class="card-action">
                                    <a class="btn-flat waves-effect" href=${`${config.clientDomain}/event/${ticket.eventId._id}/ticket/${ticket._id}`}>View</a>
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
  `);
}

function getOrderCard(ticket) {
  let serviceFee = ticket.price * ticket.eventId.totalMarkupPercent;
  let baseTotal = serviceFee + ticket.price;

  let stripeTotal = (baseTotal * 0.029) + 30;

  let total = Math.ceil(baseTotal + stripeTotal);
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
                    ${ ticket.eventId.name } <br />
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
  `);
}


export const emailPasswordChange = async(toEmail, passwordChangeUrl) => {
  let topText = 'Use this link to reset your password.';
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
  `);
  const mailOptions = {
    from: 'Terrapin Ticketing <info@terrapinticketing.com>', // sender address
    to: toEmail, // list of receivers
    subject: 'Forgot Password', // Subject line
    html: formatEmail(emailHTML, topText)
  };

  return await sendMail(mailOptions);
};

export const emailTransferTicket = async(toEmail, fromUser, ticket) => {
  let token = uuidv1();
  await new Promise((resolve) => {
    client.hset('set-password', token, toEmail, resolve);
  });
  let topText = 'You were transfered a ticket on Terrapin Ticketing.';
  let emailHTML = (`
        <tr>
            <td valign="top" class="bodyContent" mc:edit="body_content00">
                <h1>You received a ticket</h1>
                ${fromUser} transfered a ${ticket.eventId.name} to your Terrapin Ticketing account. <br /><br />

                <div style="text-align: center">
                  <a href="${config.clientDomain}/set-password/${token}" class="btn">View it Here</a>
                </div><br />
                <small>If you are unable to click the button above, copy and paste this link into your browser: ${`${config.clientDomain}/event/${ticket.eventId._id}/ticket/${ticket._id}`}</small>
            </td>
        </tr>
        ${getTicketCard(ticket, config)}
  `);

  const mailOptions = {
    from: 'Terrapin Ticketing <info@terrapinticketing.com>', // sender address
    to: toEmail, // list of receivers
    subject: `You're going to ${ticket.eventId.name}!`, // Subject line
    html: formatEmail(emailHTML, topText)
  };

  const notificationOptions = {
    from: notificationEmail, // sender address
    to: notificationEmail, // list of receivers
    subject: `Transfer Notification: ${ticket.eventId.name}`, // Subject line
    html: `${fromUser} transfered <a href="${config.clientDomain}/event/${ticket.eventId._id}/ticket/${ticket._id}">${ticket._id}</a> to ${toEmail} (Event: ${ticket.eventId.name})`
  };

  await sendMail(mailOptions);
  return await sendMail(notificationOptions);
};

export const emailRecievedTicket = async(user, ticket) => {
  let topText = 'Someone transfered you a ticket on Terrapin Ticketing.';
  let emailHTML = (`
        <tr>
            <td valign="top" class="bodyContent" mc:edit="body_content00">
                <h1>You received a ticket</h1>
                <br />
                You received a ticket to ${ticket.eventId.name}. <br /><br />
                <div style="text-align: center">
                  <a href="${`${config.clientDomain}/event/${ticket.eventId._id}/ticket/${ticket._id}`}" class="btn">View it Here</a>
                </div><br />
                <small>If you are unable to click the button above, copy and paste this link into your browser: ${`${config.clientDomain}/event/${ticket.eventId._id}/ticket/${ticket._id}`}</small>
            </td>
        </tr>
        ${getTicketCard(ticket, config)}
  `);
  const mailOptions = {
    from: 'Terrapin Ticketing <info@terrapinticketing.com>', // sender address
    to: user.email, // list of receivers
    subject: `You're going to ${ticket.eventId.name}!`, // Subject line
    html: formatEmail(emailHTML, topText)
  };

  const notificationOptions = {
    from: notificationEmail, // sender address
    to: notificationEmail, // list of receivers
    subject: `Transfer Notification: ${ticket.eventId.name}`, // Subject line
    html: `${user.email} receieved <a href="${config.clientDomain}/event/${ticket.eventId._id}/ticket/${ticket._id}">${ticket._id}</a> (Event: ${ticket.eventId.name})`
  };

  await sendMail(mailOptions);
  return await sendMail(notificationOptions);
};

export const emailSoldTicket = async(user, ticket) => {
  let topText = `Someone bought your ticket to ${ticket.eventId.name}!`;
  let emailHTML = (`
    <tr>
        <td valign="top" class="bodyContent" mc:edit="body_content00">
            <h1>Your ticket sold!</h1>
            <br />
            Your ticket for ${ticket.eventId.name} sold on Terrapin Ticketing.
            <br /><br />
            We will send ${displayPrice(ticket.price)} to ${user.payout[user.payout.default]} via ${user.payout.default.charAt(0).toUpperCase() + user.payout.default.slice(1)} in the next 24 hours. <br /><br />
            We apologize for the wait but sending funds is a manual process at the moment.
            If you have any questions, please email info@terrapinticketing.com
            <br /><br />
            <p>Cheers,<br />
            The Terrapin Ticketing Team</p>
        </td>
    </tr>
  `);
  const mailOptions = {
    from: 'Terrapin Ticketing <info@terrapinticketing.com>', // sender address
    to: user.email, // list of receivers
    subject: 'You sold your ticket!', // Subject line
    html: formatEmail(emailHTML, topText)
  };

  return await sendMail(mailOptions);
};

export const emailPurchaseTicket = async(user, ticket) => {
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
  `);
  const mailOptions = {
    from: 'Terrapin Ticketing <info@terrapinticketing.com>', // sender address
    to: user.email, // list of receivers
    subject: `Purchase Receipt: ${ticket.eventId.name}!`, // Subject line
    html: formatEmail(emailHTML, topText)
  };

  return await sendMail(mailOptions);
};

export const emailInternalPaymentNotification = async(oldOwner, newOwner, ticket) => {
  let topText = `Internal: You need to send ${displayPrice(ticket.price)} to ${oldOwner.payout[oldOwner.payout.default]} via ${oldOwner.payout.default}`;
  let emailHTML = (`
        <tr>
            <td valign="top" class="bodyContent" mc:edit="body_content00">
                <h1>We need to pay ${oldOwner.payout[oldOwner.payout.default]}</h1>
                <br />
                ${newOwner.email} bought ${oldOwner.email}'s ticket to ${ticket.eventId.name}. <br /><br />
                <b>We need to send ${displayPrice(ticket.price)} to ${oldOwner.payout[oldOwner.payout.default]} via ${oldOwner.payout.default}</b>
            </td>
        </tr>
        ${getOrderCard(ticket)}
  `);
  const mailOptions = {
    from: 'Terrapin Ticketing <info@terrapinticketing.com>', // sender address
    to: 'info@terrapinticketing.com', // list of receivers
    subject: `Send Payment: ${displayPrice(ticket.price)} to ${oldOwner.payout[oldOwner.payout.default]} via ${oldOwner.payout.default}`,
    html: formatEmail(emailHTML, topText)
  };
  return await sendMail(mailOptions);
};
