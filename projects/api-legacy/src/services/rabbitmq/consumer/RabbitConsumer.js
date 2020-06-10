/* global -Promise */
const Promise = require('bluebird');
const amqp = require('amqplib');
const dlv = require('dlv');
const {inspect} = require('util');

const {
  RABBIT_APPLICATION_USERNAME,
  RABBIT_APPLICATION_PASSWORD,
  RABBIT_INGEST_MESSAGE_QUEUE_URL
} = process.env;

const CONN_URL = `amqp://${RABBIT_APPLICATION_USERNAME}:${encodeURIComponent(
  RABBIT_APPLICATION_PASSWORD
)}@${RABBIT_INGEST_MESSAGE_QUEUE_URL}`;

class RabbitConsumer {
  constructor(queueName, queueOptions, extendedOptions) {
    this.queueName = queueName;
    this.queueOptions = queueOptions;
    this.connectionString = dlv(extendedOptions, 'connectionString', CONN_URL);
    this.debug = dlv(extendedOptions, 'debug', false);

    // This will be assigned during the #connect call
    this.messageHandlerFunc = null;
    this.channel = null;

    return this;
  }

  /**
   * Connect to a queue and start consuming messages, applying the {messageHandlerFunc} against each.
   *
   * @param {Function} messageHandlerFunc Function to be applied to each message recieved from the queue
   */
  connect(messageHandlerFunc) {
    if (messageHandlerFunc) {
      this._setMessageHandlerFunc(messageHandlerFunc);
    }

    if (this.debug) {
      console.debug(`Starting AMQP connection for queue '${this.queueName}'`);
    }

    Promise
      .bind(this)
      .then(this._getConnection)
      .then(this._createChannel)
      .then(this._assertQueue)
      .then(this._consumeChannel)
      .catch((err) => {
        console.error(`Error attempting to consume queue '${this.queueName}'`);
        console.error(dlv(err, 'message', err));
      });
  }

  /**
   * Returns a promise containing the connection object
   */
  _getConnection() {
    return amqp.connect(this.connectionString);
  }

  /**
   * Creates a channel on which we can start consuming messages
   *
   * @param {AMQPConnection} connection AMQP connection object we can create a channel with
   */
  async _createChannel(connection) {
    const channel = await connection.createChannel();
    this._setChannel(channel);

    if (this.debug) {
      console.debug(`AMQP Channel created (for '${this.queueName}')`);
    }
  }

  /**
   * Asserts that the queue we are trying to connect to with our channel object
   * exists and is set up with the same options we expect.
   */
  async _assertQueue() {
    await this.channel.assertQueue(this.queueName, this.queueOptions);
  }

  /**
   * Start taking messages from the queue we are subscribed to and applying
   * our handler function against each message
   */
  async _consumeChannel() {
    if (this.debug) {
      console.debug(
        `'${this.queueName}' queue asserted and ready to listen + consume`
      );
    }

    this.channel.consume(this.queueName, this._handleMessage.bind(this));
  }

  /**
   * Parses the message from RabbitMQ and attempts to run our
   * handler function against the message and ack it if successful.
   * If the message is undefined or null or has no value in the
   * 'content' key, the message is nacked and removed from the queues.
   *
   * @param {String} message RabbitMQ message
   */
  async _handleMessage(message) {
    if (message == null || !dlv(message, 'content')) {
      // Remove messages that aren't formatted correctly
      console.warn(
        `Delete message from queue '${this.queueName}' without processing:`,
        message
      );
      return this.channel.nack(message, false, false);
    }


    try {
      let content;
      const messageContent = message && message.content;
      if (messageContent) {
        content = JSON.parse(messageContent);
      }

      if (this.debug) {
        console.debug(`got message from queue '${this.queueName}': ${inspect(content)}`);
      }

      await this.messageHandlerFunc(content);
      // If we don't throw an error, we should be good to ACK it here
      // and consider it successfully processed.
      this.channel.ack(message);
    } catch (err) {
      console.error(
        `Error processing message from queue '${this.queueName}':`, err
      );
      console.error(`Removing message: ${inspect(message)}`);

      return this.channel.nack(message, false, false);
    }
  }

  _setChannel(channel) {
    this.channel = channel;
  }

  _setMessageHandlerFunc(fn) {
    this.messageHandlerFunc = fn;
  }
}

module.exports = RabbitConsumer;
