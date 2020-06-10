const amqp = require('amqplib');
const {
  RABBIT_APPLICATION_USERNAME,
  RABBIT_APPLICATION_PASSWORD,
  RABBIT_INGEST_MESSAGE_QUEUE_URL
} = process.env;

const CONN_URL = `amqp://${RABBIT_APPLICATION_USERNAME}:${encodeURIComponent(
  RABBIT_APPLICATION_PASSWORD
)}@${RABBIT_INGEST_MESSAGE_QUEUE_URL}`;

let channel;

async function getChannel() {
  if (channel) return Promise.resolve(channel);

  return amqp.connect(CONN_URL)
    .then(function(conn) {
      return conn.createChannel();
    })
    .then(function(ch) {
      channel = ch;
      return ch;
    })
    .catch(console.warn);
}

process.on('exit', code => {
  channel.close();
  console.log(`Closing rabbitmq channel`);
});

module.exports = async function sendToQueue(
  queueName,
  data,
  queueOptions = {durable: false}
) {
  getChannel().then((ch) => {
    return ch.assertQueue(queueName, queueOptions).then(() => {
      return ch.sendToQueue(queueName, Buffer.from(JSON.stringify(data)));
    });
  });
};
