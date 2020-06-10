const dlv = require('dlv');
const RabbitConsumer = require('./consumer/RabbitConsumer');
const UserClipMetadataModel = require('../../models/userClipMetadata');
const MalformedRabbitMessageError = require('../../errors/MalformedRabbitMessageError');

const RABBIT_METADATA_UPDATES_EXCHANGE =
  process.env.RABBIT_METADATA_UPDATES_EXCHANGE || 'd-clip-metadata-updates';

/**
 * Updates the `user_clip_metadata.metadata` column with the new data contained
 * within {content} by merging the two 'metadata' properties. If the property value
 * already exists in the database and is also present in {content}, then the value passed
 * in {content} will take precedent.
 * @param {Object} content - Contents of the rabbit message pulled from the queue
 */
async function processMetadataEntry(content) {
  if (!isMetadataEntryValid(content)) {
    console.error('Clip metadata is not valid:', content);
    throw new MalformedRabbitMessageError();
  }

  try {
    const clipMetadata = await UserClipMetadataModel.getByClipId(content.id);
    if (clipMetadata) {
      clipMetadata.metadata = {...(clipMetadata.metadata || {}), ...content.metadata};
      await UserClipMetadataModel.update(clipMetadata, ['metadata']);
    } else {
      const metadata = {
        clip_id: content.id,
        metadata: content.metadata
      };
      await UserClipMetadataModel.create(metadata);
    }
  } catch (err) {
    console.error(`Error updating metadata for clip id: ${content.id}`);
    console.error(dlv(err, 'message', err));
  }
}

/**
 * Checks to see if the rabbit message pulled from the queue is valid.
 * In order to be valid, it must have an 'id' field that is a number
 * (either string or number, ran through isNaN) as well as a 'metadata'
 * object that can be {null} or an {Object}.
 * @param {Object} entry - Rabbit message pulled from the metadata updates queue
 * @return {boolean} True if entry valid, otherwise - false
 */
function isMetadataEntryValid(entry) {
  if (
    !entry ||
    !entry.id ||
    isNaN(entry.id) ||
    (dlv(entry, 'metadata') &&
      (typeof entry.metadata !== 'object' || Array.isArray(entry.metadata)))
  ) {
    return false;
  }

  return true;
}

new RabbitConsumer(
  RABBIT_METADATA_UPDATES_EXCHANGE,
  {
    durable: true,
    noAck: true,
    arguments: {
      'x-queue-type': 'classic'
    }
  },
  {debug: true}
).connect(processMetadataEntry);

// Exports for testing
module.exports = {
  processMetadataEntry,
  isMetadataEntryValid
};
