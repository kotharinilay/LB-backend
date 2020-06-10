const dlv = require('dlv');
const {inspect} = require('util');
const express = require('express');
const router = express.Router({mergeParams: true});

const AsyncMiddleware = require('../common/middlewares/AsyncMiddleware');
const {authFilter}= require('../common/middlewares/AuthFilter');
const RequestTimer = require('../common/middlewares/RequestTimer');
const SuccessResponse = require('../common/SuccessResponse');
const UserClipService = require('../services/UserClipService');
const UserClipMetadataModel = require('../models/userClipMetadata');
const UserClip = require('../models/userClip');
const queueSend = require('../services/rabbitmq/RabbitQueueSend');

router.use(authFilter);

/**
 * Endpoint that our internal clipping pipeline POST's to in order
 * to create automatic highlight clips.
 */
router.post(
  '/auto',
  RequestTimer(),
  AsyncMiddleware(async (req, res, next) => {
    const content = req.body;
    let clip_id;

    try {
      clip_id = await UserClipService.createAuto(content);

      if (!clip_id) {
        console.error(
          `Error trying to create clip with content: ${inspect(content)}`
        );
        next(new Error('Error creating new user clip'));
        return;
      }

      // const metataggerMessage = {
      //   uuid: content.uuid,
      //   segmentUri: content.segmentUri,
      //   stream_date: content.streamDate,
      //   clip_id
      // };

      // await queueSend('metatagger', metataggerMessage, {durable: false});
      
    } catch (err) {
      console.log(`error sending message to 'metatagger' queue: ${err}`);
    }

    const responseBody = new SuccessResponse({
      message: `Clip ${clip_id} created successfully`,
      clipId: clip_id
    }).build();

    res.json(responseBody);
  })
);

/**
 * 1) Updates a metadata entry in the `user_clip_metadata` table,
 * or create a new one if it doesn't already exist.
 * 2) Updates the `user_clip.game_mode` value it finds, if it's valid
 */
router.post(
  '/metadata',
  RequestTimer(),
  AsyncMiddleware(async (req, res, next) => {
    if (!isMetadataEntryValid(req.body)) {
      console.error('Clip metadata is not valid:', req.body);
      next(new Error('Metadata entry is not valid'));
      return;
    }

    const clipId = dlv(req, 'body.clip_id');
    const metadata = dlv(req, 'body.metadata');
    const game_mode = dlv(req, 'body.game_mode');

    let returnClipId;

    try {
      const clipMetadata = await UserClipMetadataModel.getByClipId(clipId);
      if (clipMetadata) {
        clipMetadata.metadata = {
          ...(clipMetadata.metadata || {}),
          ...metadata
        };
        await UserClipMetadataModel.update(clipMetadata, ['metadata']);
        returnClipId = clipMetadata.id;
      } else {
        const newMetadata = {clip_id: clipId, metadata};
        returnClipId = await UserClipMetadataModel.create(newMetadata);
        if (!returnClipId) {
          throw new Error('something went wrong during clip creation');
        }
      }
    } catch (err) {
      console.error(`Error updating metadata for clip id: ${clipId}`);
      console.error(dlv(err, 'message', err));
      next(new Error(`Unable to update clip metadata for id ${clipId}`));
      return;
    }

    let returnMessage = `MetadataEntry ${returnClipId} for Clip ID ${clipId} updated successfully.`;

    if (!isGameModeValid(game_mode)) {
      console.error(`game_mode value passed for clip id ${clipId} is not valid: '${game_mode}'`);
      returnMessage += ` However, the game_mode value passed (${game_mode}) is invalid and discarded.`;
    } else {
      await updateUserClipGameMode(game_mode, clipId);
    }

    res.json(new SuccessResponse(returnMessage).build());
  })
);

/**
 * Checks to see if the request body for creating a clip metadata entry is valid.
 * In order to be valid, it must have an 'clip_id' field that is a number
 * (either string or number, ran through isNaN) as well as a 'metadata'
 * object that can be {null} or an {Object}.
 * @param {Object} entry - POST request body
 * @return {boolean} True if entry valid, otherwise - false
 */
function isMetadataEntryValid(entry) {
  if (
    !entry ||
    !entry.clip_id ||
    isNaN(entry.clip_id ) ||
    (dlv(entry, 'metadata') &&
      (typeof entry.metadata !== 'object' || Array.isArray(entry.metadata)))
  ) {
    return false;
  }

  return true;
}

/**
 * Update the `user_clip.game_mode` column from the default of 'Battle Royale'.
 * @param {string} gameMode The mode of game being played in the clip
 */
async function updateUserClipGameMode(gameMode, clipId) {
  return UserClip.update({game_mode: gameMode, id: clipId}, ['game_mode']);
}

const isGameModeValid = (gameMode) =>
  gameMode != null &&
  typeof gameMode === 'string' &&
  gameMode.trim().length > 0;

module.exports = router;
