module.exports = {
  sender: process.env.MAIL_SENDER,
  transport: {
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: true,
    auth: {
      user: process.env.MAIL_SENDER,
      pass: process.env.MAIL_PASSWORD
    }
  }
};
