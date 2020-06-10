const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-2'});

const cw = new AWS.CloudWatch({
  accessKeyId: process.env.AWS_CREDENTIALS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_CREDENTIALS_SECRET_KEY,
  apiVersion: '2010-08-01'
});

module.exports = cw;