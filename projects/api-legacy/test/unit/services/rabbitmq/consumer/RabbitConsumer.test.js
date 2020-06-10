const { expect } = require('chai');
const sinon = require('sinon');
/* global -Promise */
const Promise = require('bluebird');

const RabbitConsumer = require('../../../../../services/rabbitmq/consumer/RabbitConsumer');
const MalformedRabbitMessageError = require('../../../../../errors/MalformedRabbitMessageError');

describe('RabbitConsumer', function() {
  it('should return initialized class after it is created', function() {
    const rabbitConsumer = new RabbitConsumer();
    expect(rabbitConsumer).to.be.an.instanceOf(RabbitConsumer);
  });

  it('should set all proper class properties in the constructor', function() {
    const queueName = 'test-queue';
    const queueOptions = {
      durable: true,
      arguments: {
        'x-queue-type': 'classic'
      }
    };
    const extendedOptions = {
      debug: true,
      connectionString: 'amqp://user:password@raggit-ingest-url'
    };

    const rabbitConsumer = new RabbitConsumer(
      queueName,
      queueOptions,
      extendedOptions
    );

    expect(rabbitConsumer.queueName).to.equal(queueName);
    expect(rabbitConsumer.queueOptions).to.eql(queueOptions);
    expect(rabbitConsumer.debug).to.be.true;
    expect(rabbitConsumer.connectionString).to.eql(
      extendedOptions.connectionString
    );
  });

  it(`should set channel object to 'this.channel' once created`, async function() {
    const rabbitConsumer = new RabbitConsumer('test-queue');
    const connectionMock = {
      createChannel: async () => Promise.resolve('Hello World')
    };
    sinon.spy(connectionMock, 'createChannel');

    await rabbitConsumer._createChannel(connectionMock);
    expect(connectionMock.createChannel.called).to.be.true;
    expect(rabbitConsumer.channel).to.equal('Hello World');
  });

  it.skip('should call #channel.consume() with correct args', async function() {
    const queueName = 'test-queue';
    const channelMock = {consume: function(){}};
    const channelSpy = sinon.spy(channelMock, 'consume');

    const rabbitConsumer = new RabbitConsumer(queueName, {});
    rabbitConsumer._setChannel(channelMock);

    await rabbitConsumer._consumeChannel();
    expect(channelSpy.called).to.be.true;
    expect(
      channelSpy.calledWithExactly(queueName, rabbitConsumer._handleMessage)
    ).to.be.true;
  });

  describe('#_handleMessage', function() {

    it(`should nack the message if it's null`, async function() {
      const channelMock = {
        nack: sinon.spy(),
        ack: sinon.spy()
      };
      const messageHandlerMock = sinon.stub().resolves();

      const rabbitConsumer = new RabbitConsumer('test', {});
      rabbitConsumer._setChannel(channelMock);
      rabbitConsumer._setMessageHandlerFunc(messageHandlerMock);

      await rabbitConsumer._handleMessage();

      expect(channelMock.nack.called).to.be.true;
      expect(channelMock.ack.called).to.not.be.true;
      expect(messageHandlerMock.called).to.not.be.true;
    });

    it(`should nack the message if it's got no 'content' key in message`, async function() {
      const channelMock = {
        nack: sinon.spy(),
        ack: sinon.spy()
      };
      const messageHandlerMock = sinon.stub().resolves();

      const rabbitConsumer = new RabbitConsumer('test', {});
      rabbitConsumer._setChannel(channelMock);
      rabbitConsumer._setMessageHandlerFunc(messageHandlerMock);

      await rabbitConsumer._handleMessage({
        title: 'Ninja gets a knockdown',
        url: 'https://twitch.tv/videos/39480752'
      });

      expect(channelMock.nack.called).to.be.true;
      expect(channelMock.ack.called).to.not.be.true;
      expect(messageHandlerMock.called).to.not.be.true;
    });

    it(`should ack the message if HAS 'content' key in message`, async function() {
      const channelMock = {
        nack: sinon.spy(),
        ack: sinon.spy()
      };
      const message = {
        id: 1
      };
      message.content = JSON.stringify({
        title: 'Ninja gets a knockdown',
        url: 'https://twitch.tv/videos/39480752'
      });
      const messageHandlerMock = sinon.stub().resolves();

      const rabbitConsumer = new RabbitConsumer('test', {});
      rabbitConsumer._setChannel(channelMock);
      rabbitConsumer._setMessageHandlerFunc(messageHandlerMock);

      await rabbitConsumer._handleMessage(message);

      expect(channelMock.ack.called).to.be.true;
      expect(channelMock.nack.called).to.not.be.true;
      expect(messageHandlerMock.called).to.be.true;
    });

    it(`should NACK the message if error thrown is instanceof MalformedRabbitMessageError`, async function() {
      // Suppress console.info messages for this one
      let oldConsoleInfo = console.info;
      console.info = () => {};

      const channelMock = {
        nack: sinon.spy(),
        ack: sinon.spy()
      };
      const message = {
        id: 1
      };
      message.content = JSON.stringify({
        title: 'Ninja gets a knockdown',
        url: 'https://twitch.tv/videos/39480752'
      });

      const messageHandlerMock = async function(content) {
        throw new MalformedRabbitMessageError();
      };

      const rabbitConsumer = new RabbitConsumer('test', {});
      rabbitConsumer._setChannel(channelMock);
      rabbitConsumer._setMessageHandlerFunc(messageHandlerMock);

      try {
        await rabbitConsumer._handleMessage(message);
      } catch(err) {
        expect(err instanceof MalformedRabbitMessageError).to.be.true;
      } finally {
        expect(channelMock.ack.called).to.not.be.true;
        expect(channelMock.nack.called).to.be.true;
      }

      // Restore console.info
      console.info = oldConsoleInfo;
    });
  });
});
