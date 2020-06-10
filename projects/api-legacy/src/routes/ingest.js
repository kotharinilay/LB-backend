const express = require('express');
const router = express.Router({ mergeParams: true });

const crypto = require('crypto');
const validator = require('validator');

const {authFilter} = require('../common/middlewares/AuthFilter');
const BadRequestError = require('../errors/BadRequestError');
const IngestService = require('../services/IngestService');
const TwitchService = require('../services/social/TwitchService');
const YoutubeService = require('../services/social/YoutubeService');
const MixerService = require('../services/social/MixerService');
const MixerSearchService = require('../services/social/search/MixerSearchService');
const sendToQueue = require('../services/rabbitmq/RabbitQueueSend');
const SuccessResponse = require('../common/SuccessResponse');
const AsyncMiddleware = require('../common/middlewares/AsyncMiddleware');
const RequestTimer = require('../common/middlewares/RequestTimer')

const ALLOWED_ACTIONS = new Set(['start', 'stop']);

router.use(authFilter);

router.post(
  '/',
  RequestTimer(),
  AsyncMiddleware(async (req, res, next) => {
    
    validateRequestBody(req.body);

    const userId = req.userId;
    
    let {uri, action, uuid, streamerName, title, gameName, ingestResolution} = req.body;

    if (!uuid) {

      // It's a new ingest job, make sure the game is supported
      var gameSupportedResults = await validateSupportedGame(req.body.source)

      console.log("gameSupportedResults", gameSupportedResults)

      // return;

      if (!gameSupportedResults["supported"]) {
        console.log(gameSupportedResults)
        throw new BadRequestError('Game is unknown or not supported');
      }

      gameName = gameSupportedResults["gameName"];

      uuid = crypto.randomBytes(16).toString('hex');
    }

    // Going to skip the await here and just return 200 to make this
    // endpoint snappier. It will throw an error if something is wrong
    const data = {
      uri,
      clientID: userId,
      action,
      uuid,
      streamerName,
      title,
      gameName,
      payload: {
        userId: userId
      },
      ingestResolution
    };

    // console.log("data", data)

    // return;

    try {
      const ingestResponse = await IngestService.scheduleJob(data);

      if (action === 'stop') {
        return res.json(
          new SuccessResponse(
            `Ingest job ${uuid} stopped by user: ${userId}`
          ).build()
        );
      } 

      // Now that we have successfully sent this REST request, we can
      // safely put the job into the classify queue as well to let
      // the classifier know that it can start reading in files. The
      // classifier does NOT require a stop action.

      // const classifyData = {
      //   status: action,
      //   clientID: userId,
      //   uuid,
      //   gameName,
      //   segmentUri: `media/streams/${uuid}/`,
      //   streamerName
      // }

      // await sendToQueue(
      //   'classify',
      //   classifyData
      // );

    } catch(err) {
      console.error('Error trying to create ingest job', err);
      next(err);
      return;
    }

    const responseObject = {uuid};
    if (action.toLowerCase() === 'stop') {
      responseObject.message = `Job with UUID '${uuid}' stopped`;
    }

    res.json(new SuccessResponse(responseObject).build());
  })
);

const validateRequestBody = ({uri, action, uuid}) => {
  if (!ALLOWED_ACTIONS.has(action.toLowerCase())) {
    throw new BadRequestError('action not allowed');
  }

  if (!validator.isURL(uri)) {
    throw new BadRequestError('uri formatted incorrectly or invalid');
  }

  if (action.toLowerCase() === 'stop' && !uuid) {
    throw new BadRequestError('Must pass a job uuid value to stop');
  }
};

async function validateSupportedGame(sourceUrl) {
  // Make sure the game is supported

  if (typeof sourceUrl == "object") {
    sourceUrl = sourceUrl["url"]
  }

  var gameName = "";
  var gameSupported = false;

  if (sourceUrl.match(/(twitch)/)) {

    var gameObject = await TwitchService.twitchGetGameName(sourceUrl);

    // console.log("gameObject", gameObject)

    if (gameObject) {
      gameName = gameObject["gameName"]
    }
  } else if (sourceUrl.match(/(youtube)/)) {

    var gameObject = await YoutubeService.getGameName(sourceUrl);

    console.log("YouTube gameObject", gameObject)

    if (gameObject) {
      gameName = gameObject["gameName"]
    }    

  } else if (sourceUrl.match(/(mixer)/)) {
    
    const regex = /[0-9]+$/gm;
    let m;

    var recordingId = false

    while ((m = regex.exec(sourceUrl)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }
        
        if (m[0]) {
          recordingId = m[0]
          break;
        }
    }

    if (recordingId) {
      const recordingDetails = await MixerSearchService.getRecordingDetails(recordingId);

      if (recordingDetails) {
        
        var gameId = recordingDetails["typeId"]

        if (gameId == MixerService.getGameIdFortnite()) {
          gameName = "fortnite"
        } else if (gameId == MixerService.getGameIdValorant()) {
          gameName = "valorant"
        } else if (gameId == MixerService.getGameIdWarzone()) {
          gameName = "warzone"
        }

      }
     
    }
  }

  if (gameName) {
    gameName = gameName.toLowerCase();
  }

  if (gameName == "fortnite" || 
      gameName == "valorant" || 
      gameName == "warzone" || 
      gameName == "call of duty: modern warfare") {
    gameSupported = true;
  }

  if (gameName == "call of duty: modern warfare") {
    gameName = "warzone"
  }

  return {
    "supported": gameSupported,
    "gameName": gameName
  };
}

module.exports = router;
