const nodemailer = require('nodemailer');

const FROM_VALUE = 'WizardLabs <noreply@wizardlabs.gg>';
const EMAIL_ACCOUNT = process.env.GMAIL_MAIL_ACCOUNT_LOGIN;
const EMAIL_PASSWORD = process.env.GMAIL_MAIL_ACCOUNT_PASSWORD;

const mailTransport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_ACCOUNT,
    pass: EMAIL_PASSWORD
  }
});

class GmailService {
    async sendPlain(to, subject, body) {
      const mailOptions = {
        from: FROM_VALUE,
        to: to,
        subject: subject,
        text: body
      };

      return mailTransport.sendMail(mailOptions);
    }
}

const instance = new GmailService();
module.exports = instance;
