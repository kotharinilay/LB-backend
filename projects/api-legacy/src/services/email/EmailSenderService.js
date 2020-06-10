const GmailService = require('./GmailService');
const SESService = require('./SESService');
const WEB_BASE_URL = process.env.WEB_BASE_URL;
const moment = require('moment');

class EmailSenderService {
  async sendPasswordRecoveryEmail(user, token) {
    const to = user.email;
    const subject = 'Password Recovery';
    const resetLink = buildResetLink(token);
    const body =
      'Hi,\n' +
      '\n' +
      'We received a request to change your password\n' +
      '\n' +
      'Use the link below to set up a new password for your account.\n' +
      'This link will expire in 24 hours.\n' +
      '\n' +
      `Change Password: ${resetLink}\n` +
      '\n' +
      'If you did not make this request, you do not need to do anything.\n' +
      '\n' +
      'Thanks for your time,\n' +
      'The WizardLabs Team';

    return GmailService.sendPlain(to, subject, body);
  }

  async onBetaUserSignup(email) {
    const toAddresses = ['royce@wizardlabs.gg', 'robert@wizardlabs.gg', 'ss@wizardlabs.gg'];
    const subject = `New Wizardlabs Beta Signup: ${email}!`;
    const body =
      '<h1 style="font-size:600%;">We\'re hot hot HOT!!!!</h1>' +
      '<br />' +
      '<img src="https://i.imgur.com/MU5pog.jpg"></img>' +
      '<h2>' +
      email +
      ' wants our product pretty bad even though our splash page says nothing</h2>' +
      '<br />' +
      '<span style="font-style:italic;">' +
      moment().format('MMMM Do YYYY, h:mm:ss a');
    +'</span>';

    return SESService.sendRichMail(toAddresses, subject, body);
  }

  async onMediaRequested(email, type, url, status) {
    const toAddresses = email;
    let subject = "";
    let body = "";

    if(status){

      subject = `Your requested ${type} file from WizardLabs is ready!`;
      body =
      'Your requested Youtube Content is ready, please click the link below to download' +
      '\n' +
      url;

    }else{
      subject = `Error while processing your ${type} file from WizardLabs!`;
      body =
      'There was an error downloading your Youtube content. Please contact support@wizardlabs.gg' 

    }
    
    return GmailService.sendPlain(toAddresses, subject, body);
  }
}

function buildResetLink(token) {
  return WEB_BASE_URL + `/auth/reset-password?token=${token}`;
}

const instance = new EmailSenderService();
module.exports = instance;
