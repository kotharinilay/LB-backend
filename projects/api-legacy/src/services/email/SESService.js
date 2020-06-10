var AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
const SES = new AWS.SES({apiVersion: '2010-12-01'});

const FROM_ADDRESS = 'no-reply@wizardlabs.gg';

/**
 * Send emails through Amazon's Simple Email Service.
 *
 * The addresses used here (both to AND from) must be a pre-verified
 * email address within the SES console or this will fail.
 */
class SESService {
  /**
   * Send an HTML-formatted email message through AWS Simple Email Service.
   * @param {Array<string>} toAddresses - email addresses that are verified by AWS SES
   * @param {string} subject - subject of the email
   * @param {string} body - HTML formatted body
   */
  async sendRichMail(toAddresses, subject, body) {
    const params = {
      Destination: {
        ToAddresses: toAddresses
      },
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: body
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: subject
        }
      },
      Source: FROM_ADDRESS
    };

    await SES.sendEmail(params).promise()
  }
}

const instance = new SESService();
module.exports = instance;
