const UserClipService = require('../../UserClipService');
const RabbitConsumer = require('./RabbitConsumer');
const queueSend = require('../RabbitQueueSend');

// Function to be run against the messages coming into
// the queue we are consuming. Creates an entry in the
// wizardlabs.user_clip table, and places a message on the
// 'metatagger' queue for further processing in the pipeline
async function processClip(content) {
  try {
    const clip_id = await UserClipService.createAuto(content);

    if (!clip_id) {
      throw new Error('clip id came back undefined!')
    }

    const metataggerMessage = {
      uuid: content.uuid,
      segmentUri: content.segmentUri,
      clip_id
    };

    await queueSend('metatagger', metataggerMessage, {durable: false});
  } catch(err) {
    console.log(`error sending message to 'metatagger' queue: ${err}`);
  }
}

// Create new RabbitConsumer for 'd-clip-ready' queue
new RabbitConsumer(
  'd-clip-ready',
  {
    durable: true,
    noAck: true,
    arguments: {
      'x-queue-type': 'classic'
    }
  },
  {debug: true}
).connect(async (content) => processClip(content));
