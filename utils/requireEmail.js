import nodemailer from 'nodemailer';
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

export const ticketReceived = async(toEmail, fromUser, eventName) => {
  const mailOptions = {
    from: 'info@terrapinticketing.com', // sender address
    to: toEmail, // list of receivers
    subject: `${fromUser} has sent you tickets to (${eventName})`, // Subject line
    html: '<p>some stuff</p>'// plain text body
  };

  return await sendMail(mailOptions);
};
