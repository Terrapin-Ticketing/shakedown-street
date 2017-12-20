import nodemailer from 'nodemailer';
import redis from 'redis';
import config from 'config';

const uuidv1 = require('uuid/v4');

let client = redis.createClient();

let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'info@terrapinticketing.com',
    pass: process.env.INFO_PASS
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

export const emailPasswordChange = async(toEmail, passwordChangeUrl) => {
  const mailOptions = {
    from: 'info@terrapinticketing.com', // sender address
    to: toEmail, // list of receivers
    subject: 'forget your password?', // Subject line
    html: `
<p>
  go to this link to change your password: ${passwordChangeUrl}
</p>`// plain text body
  };

  return await sendMail(mailOptions);
};

export const emailTransferTicket = async(toEmail, fromUser, eventName) => {
  let token = uuidv1();
  await new Promise((resolve) => {
    client.hset('set-password', token, toEmail, resolve);
  });

  // userCol.requestPasswordChange(toEmail);

  // await new Promise((resolve, reject) => {
  //   client.hget('set-password', toEmail, (err, token) => {
  //     if (err) return reject(err);
  //     resolve(token);
  //   });
  // });

  const mailOptions = {
    from: 'info@terrapinticketing.com', // sender address
    to: toEmail, // list of receivers
    subject: `You're going to ${eventName}!`, // Subject line
    html: `
<p>
  go to this link to claim your ticket: ${config.clientDomain}/set-password/${token}
</p>`// plain text body
  };

  // return await sendMail(mailOptions);
  return await sendMail(mailOptions);
};

export const emailRecievedTicket = async(email, event) => {
  const mailOptions = {
    from: 'info@terrapinticketing.com', // sender address
    to: email, // list of receivers
    subject: `You're going to ${event.name}!`, // Subject line
    html: `
<p>
  go to this link view your tickets: ${config.clientDomain}/my-profile
</p>`// plain text body
  };

  return await sendMail(mailOptions);
};

export const emailSoldTicket = async(email, ticket) => {
  let event = ticket.eventId;
  const mailOptions = {
    from: 'info@terrapinticketing.com', // sender address
    to: email, // list of receivers
    subject: 'You sold your ticket!', // Subject line
    html: `
<p>
  You sold your ticket for ${event.name}
</p>`// plain text body
  };

  return await sendMail(mailOptions);
};
