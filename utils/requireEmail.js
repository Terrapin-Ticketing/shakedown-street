import nodemailer from 'nodemailer';
import redis from 'redis';
import config from 'config';

const emailTemplates = require('./emailTemplates');


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

function formatEmail(emailHTML) {
  return emailTemplates.default(emailHTML);
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
                                      <i>${ticket.type}</i> <br /><br />
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

function getOrderCard(ticket, config) {
  let serviceFee = 100;
  let cardFee = 100;
  return (`
    <div class="order-details card-content col s12 l6">
          <h2>Order Details</h2>
          <div class="order-box">
            <table class="order-table bordered">
              <thead>
                <tr class="order-details-header">
                  <th class="name-column">Event</th>
                  <th>Price</th>
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
                <tr class="card-fee"><td class="name-column">Credit Card Processing</td><td>${displayPrice(cardFee)}</td></tr>
                <tr class="total"><td class="name-column">Total:</td><td>${displayPrice(calculateTotal(ticket.price, serviceFee, cardFee))}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
  `);
}


export const emailPasswordChange = async(toEmail, passwordChangeUrl) => {
  let emailHTML = (`
    <tr>
      <td valign="top" class="bodyContent" mc:edit="body_content00">
          <h1>Reset Password</h1>
          <h3>You're a lost sailor. You've been too long at sea!</h3>
          Someone requested to change your password. Follow the instructions below to reset it.
          <br /><br />
          Click this link to reset your password: ${passwordChangeUrl}
          <br /><br />
          <div style="text-align: center;">
            <button class="btn">Reset Password</button>
          </div>
    </td>
    </tr>
  `);
  const mailOptions = {
    from: 'Terrapin Ticketing <info@terrapinticketing.com>', // sender address
    to: toEmail, // list of receivers
    subject: 'Forgot Password', // Subject line
    html: formatEmail(emailHTML)
  };

  return await sendMail(mailOptions);
};

export const emailTransferTicket = async(toEmail, fromUser, ticket) => {
  let token = uuidv1();
  await new Promise((resolve) => {
    client.hset('set-password', token, toEmail, resolve);
  });

  let emailHTML = (`
        <tr>
            <td valign="top" class="bodyContent" mc:edit="body_content00">
                <h1>You received a ticket</h1>
                You received a ticket to ${ticket.eventId.name} from ${fromUser}. <br /><br />

                We created an account for you on Terrapin Ticketing to manage your ticket. Please set your account password using this link: ${config.clientDomain}/set-password/${token}
            </td>
        </tr>
        ${getTicketCard(ticket, config)}
      <!-- <tr>
          <td class="bodyContent" style="padding-top:0; padding-bottom:0;">
              <img src="http://gallery.mailchimp.com/27aac8a65e64c994c4416d6b8/images/body_placeholder_650px.png" style="max-width:560px;" id="bodyImage" mc:label="body_image" mc:edit="body_image" mc:allowtext />
            </td>
        </tr> -->
        <!-- <tr>
            <td valign="top" class="bodyContent" mc:edit="body_content01">
                <h2>Styling Your Content</h2>
                <h4>Make your email easy to read</h4>
                After you enter your content, highlight the text you want to style and select the options you set in the style editor in the "<em>styles</em>" drop down box. Want to <a href="http://www.mailchimp.com/kb/article/im-using-the-style-designer-and-i-cant-get-my-formatting-to-change" target="_blank">get rid of styling on a bit of text</a>, but having trouble doing it? Just use the "<em>remove formatting</em>" button to strip the text of any formatting and reset your style.
            </td>
        </tr> -->
  `);

  const mailOptions = {
    from: 'Terrapin Ticketing <info@terrapinticketing.com>', // sender address
    to: toEmail, // list of receivers
    subject: `You're going to ${ticket.eventId.name}!`, // Subject line
    html: formatEmail(emailHTML)
  };

  // return await sendMail(mailOptions);
  return await sendMail(mailOptions);
};

export const emailRecievedTicket = async(email, ticket) => {
  let emailHTML = (`
        <tr>
            <td valign="top" class="bodyContent" mc:edit="body_content00">
                <h1>You received a ticket</h1>
                <br />
                You received a ticket to ${ticket.eventId.name}. <br /><br />
                <div style="word-wrap: break-word">View it here: ${`${config.clientDomain}/event/${ticket.eventId._id}/ticket/${ticket._id}`}</div>
            </td>
        </tr>
        ${getTicketCard(ticket, config)}
      <!-- <tr>
          <td class="bodyContent" style="padding-top:0; padding-bottom:0;">
              <img src="http://gallery.mailchimp.com/27aac8a65e64c994c4416d6b8/images/body_placeholder_650px.png" style="max-width:560px;" id="bodyImage" mc:label="body_image" mc:edit="body_image" mc:allowtext />
            </td>
        </tr> -->
        <!-- <tr>
            <td valign="top" class="bodyContent" mc:edit="body_content01">
                <h2>Styling Your Content</h2>
                <h4>Make your email easy to read</h4>
                After you enter your content, highlight the text you want to style and select the options you set in the style editor in the "<em>styles</em>" drop down box. Want to <a href="http://www.mailchimp.com/kb/article/im-using-the-style-designer-and-i-cant-get-my-formatting-to-change" target="_blank">get rid of styling on a bit of text</a>, but having trouble doing it? Just use the "<em>remove formatting</em>" button to strip the text of any formatting and reset your style.
            </td>
        </tr> -->
  `);
  const mailOptions = {
    from: 'Terrapin Ticketing <info@terrapinticketing.com>', // sender address
    to: email, // list of receivers
    subject: `You're going to ${ticket.eventId.name}!`, // Subject line
    html: formatEmail(emailHTML)
  };

  return await sendMail(mailOptions);
};

export const emailSoldTicket = async(email, ticket) => {
  let emailHTML = (`
    <tr>
        <td valign="top" class="bodyContent" mc:edit="body_content00">
            <h1>Your ticket sold!</h1>
            <br />
            Your ticket for ${ticket.eventId.name} sold for ${displayPrice(ticket.price)} on Terrapin Ticketing.
            <br /><br />
            We will send the funds to your account in the next 24 hours. We apologize for the wait but sending funds is a manual process at the moment. If you have any questions, please email info@terrapinticketing.com
        </td>
    </tr>
  `);
  const mailOptions = {
    from: 'Terrapin Ticketing <info@terrapinticketing.com>', // sender address
    to: email, // list of receivers
    subject: 'You sold your ticket!', // Subject line
    html: formatEmail(emailHTML)
  };

  return await sendMail(mailOptions);
};

export const emailPurchaseTicket = async(email, ticket) => {
  let emailHTML = (`
        <tr>
            <td valign="top" class="bodyContent" mc:edit="body_content00">
                <h1>You purchased a ticket</h1>
                <br />
                You purchased a ticket to ${ticket.eventId.name}. <br /><br />
                <div style="word-wrap: break-word">View it here: ${`${config.clientDomain}/event/${ticket.eventId._id}/ticket/${ticket._id}`}</div>
            </td>
        </tr>
        ${getTicketCard(ticket, config)}
        <tr>
          <td valign="top" class="bodyContent">
          ${getOrderCard(ticket, config)}
        </td>
      </tr>
  `);
  const mailOptions = {
    from: 'Terrapin Ticketing <info@terrapinticketing.com>', // sender address
    to: email, // list of receivers
    subject: `Purchase Receipt: ${ticket.eventId.name}!`, // Subject line
    html: formatEmail(emailHTML)
  };

  return await sendMail(mailOptions);
};
