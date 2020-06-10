const util = require('util');
const AWS = require('aws-sdk');

AWS.config.region = 'us-east-1';
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'us-east-1:77d0b060-cf38-4982-b9ca-0437948fc1ae',
});

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_CREDENTIALS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_CREDENTIALS_SECRET_KEY
});

const multer = require('multer');
const crypto = require('crypto');
const path = require('path')

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    files: 1,
    fileSize: 1 * 20480 * 20480,
  }
});
const fileUpload = upload.fields([
  // {name: 'clipFile', maxCount: 1},
  {name: 'clipFrameFile', maxCount: 1}
]);

const express = require('express');
const moment = require('moment');
const router = express.Router({mergeParams: true});

const UserClip = require('../models/userClip');
const UserClipMetadataModel = require('../models/userClipMetadata');
const CinematicModel = require('../models/cinematic');

const AsyncMiddleware = require('../common/middlewares/AsyncMiddleware');
const {authFilter}= require('../common/middlewares/AuthFilter');
const RequestTimer = require('../common/middlewares/RequestTimer');
const {validateFieldsParameter} = require('../common/middlewares/FieldsQueryParameterValidator');
const NotFoundError = require('../errors/NotFoundError');
const CinematicsService = require('../services/cinematics/CinematicsService');
const SuccessResponse = require('../common/SuccessResponse');
const {buildPagingSorting} = require('../common/PagingSorting');

const BadGatewayError = require('../errors/BadGatewayError');

router.use(authFilter);

// Gives access to all the available clips
// Used by lambda, etc.

router.get(
  '/clips',
  RequestTimer('/api/v1/cinematics/clips'),
  AsyncMiddleware(async (req, res) => {
    const pagingSorting = buildPagingSorting(req.query);
    const tag = req.query.tag;
    const name = req.query.name;
    const fromTime = req.query.from;
    const toTime = req.query.to;
    const killCount = req.query.killCount;
    const killDistance = req.query.killDistance;
    const weaponType = req.query.weaponType;
    const streamer = req.query.streamer;
    const gameMode = req.query.gameMode;

    const {
      data: clips,
      pagination
    } = await UserClip.getAllActiveClips(
      tag,
      name,
      killCount,
      killDistance,
      weaponType,
      streamer,
      gameMode,
      fromTime,
      toTime,
      pagingSorting
    );
    const responseData = clips.map((clip) => buildClipResponseModel(clip));

    const responseBody = new SuccessResponse({
      pagination,
      data: responseData
    }).build();
    res.json(responseBody);
  })
);

router.post(
  '/process',
  fileUpload,
  RequestTimer(),
  AsyncMiddleware(async (req, res, next) => {

    // var clipFileData = req.files.clipFile;
    // if (!clipFileData || clipFileData.length !== 1) {
    //   console.log('Clip File is Required', req.files);
    //   throw new BadRequestError('Clip File is Required');
    // }
    // clipFileData = clipFileData[0]

    var clipFrameFileData = req.files.clipFrameFile;
    if (!clipFrameFileData || clipFrameFileData.length !== 1) {
      console.log('Clip Frame File is Required', req.files);
      throw new BadRequestError('Clip Frame File is Required');
    }
    clipFrameFileData = clipFrameFileData[0]

    let {userId, clipId, cinematicKeyframeNumber} = req.body;

    if (!userId) {
      var msg = "User ID is required";
      console.error(
        msg
      );
      next(new Error(msg));
      return;
    }

    if (!clipId) {
      var msg = "Clip ID is required";
      console.error(
        msg
      );
      next(new Error(msg));
      return;
    }

    if (!cinematicKeyframeNumber) {
      var msg = "Cinematic Keyframe Number is required";
      console.error(
        msg
      );
      next(new Error(msg));
      return;
    }

    const uniqueName = crypto.randomBytes(8).toString('hex')

    // Upload the Frame
    const frameName = "cinematic/stage/keyframe_pick/" + userId + "_" + clipId + "_" + uniqueName + path.extname(clipFrameFileData["originalname"]);
    await putObject(clipFrameFileData["buffer"], frameName, "prod-wizardlabs-cinematic")
    console.log("Uploaded " + frameName)

    // Upload the Clip
    // const clipName = userId + "_" + uniqueName + path.extname(clipFileData["originalname"]);
    // await putObject(clipFileData["buffer"], clipName, "prod-wizardlabs-cinematic")
    // console.log("Uploaded " + clipName)

    // Copy Clip File to Bucket
    const clipDetails = await UserClip.getById(clipId)

    const copyFromBucket = "wizardlabs.gg"
    const FileToCopy = clipDetails['path']
    const copyToBucket = "prod-wizardlabs-cinematic"
    const saveFileAs = "cinematic/stage/keyframe_pick/" + userId + "_" + clipId + "_" + uniqueName + path.extname(FileToCopy);
   
    await copyObject(copyFromBucket, FileToCopy, copyToBucket, saveFileAs)
    
    console.log("Successfully copied to " + copyToBucket + "/" + saveFileAs)

    clipDetails['metadata']['cinematicKeyframeNumber'] = cinematicKeyframeNumber

    await UserClip.update(clipDetails, ['metadata']);

    const responseBody = new SuccessResponse({
      message: `Successfully scheduled`
    }).build();

    res.json(responseBody);

  })
);

router.post(
  '/new',
  RequestTimer(),
  AsyncMiddleware(async (req, res, next) => {
    
    let {userId, clipId, videoUrl, thumbUrl, package} = req.body;

    cinematic_id = await CinematicsService.newVideo({
      user_id: userId,
      clip_id: clipId,
      video_url: videoUrl,
      thumb_url: thumbUrl,
      package: package
    });

    if (!cinematic_id) {
      console.error(
        `Couldn't save the Cinematic video entry`
      );
      next(new Error('Couldn\'t save the Cinematic video entry'));
      return;
    }

    // send a push notification
    // todo: send notification to only to the user id's device

    // Get end points
    var params = {
      PlatformApplicationArn: 'arn:aws:sns:us-east-1:160492786134:app/APNS_SANDBOX/Wizard_Cinematics_iOS_Dev'
    };
    var sns = new AWS.SNS();
    sns.listEndpointsByPlatformApplication(params, function(err, data) {
      if (err) {
        console.log(err, err.stack);
      } else {
        for (let endpoint of data["Endpoints"]) {

          var params = {
            Message: 'Cinematic Video # ' + cinematic_id + ' is ready for review!\nPlease refresh the Cinematics tab!',
            TargetArn: endpoint["EndpointArn"]
          };

          var publishTextPromise = new AWS.SNS({apiVersion: '2010-03-31'}).publish(params).promise();

          publishTextPromise.then(
            function(data) {
              console.log(`Message ${params.Message} sent to the device ${params.TargetArn}`);
              console.log("MessageID is " + data.MessageId);
            }).catch(
              function(err) {
              console.error(err, err.stack);
            });
        }
      }
    });

    const responseBody = new SuccessResponse({
      message: `Successfully saved the video entry`,
      cinematicId: cinematic_id
    }).build();

    res.json(responseBody);

  })
);

router.post(
  '/auto',
  RequestTimer(),
  AsyncMiddleware(async (req, res, next) => {

    const userId = req.userId;
    
    let {clipId} = req.body;

    if (!userId) {
      console.error(
        `Error: User ID is Required`
      );
      next(new Error('User ID Required. Could not schedule a Cinematic Job!'));
      return;
    }

    if (!clipId) {
      console.error(
        `Error: Clip ID is Required`
      );
      next(new Error('Clip ID Required. Could not schedule a Cinematic Job!'));
      return;
    }

    // validate the clip id
    var clipDetails = await UserClip.getById(clipId)

    if (!clipDetails) {
      console.error(
        `Error: Invalid Clip`
      );
      next(new Error('Invalid Clip'));
      return;

    }

    // console.log("clipDetails",clipDetails)

    if (!clipDetails["event_second"]) {
      clipDetails["event_second"] = 9
    }

    // Copy the Thumbnail File and Clip
    const uniqueName = crypto.randomBytes(8).toString('hex')

    // Upload the Frame
    await copyObject("wizardlabs.gg", clipDetails["thumbnail_path"], "prod-wizardlabs-cinematic", "cinematic/stage/keyframe_pick/"+userId+"_"+clipId+"_"+uniqueName+".jpg")
    console.log("Copied thumbnail")

    await copyObject("wizardlabs.gg", clipDetails["path"], "prod-wizardlabs-cinematic", "cinematic/stage/keyframe_pick/"+userId+"_"+clipId+"_"+uniqueName+".mp4")
    console.log("Copied clip")

    const responseBody = new SuccessResponse({
      message: `Request has been successfully scheduled. Please check back in few minutes.`
    }).build();

    res.json(responseBody);

  })
);

router.post(
  '/video/:videoId/delete',
  RequestTimer(),
  AsyncMiddleware(async (req, res, next) => {

    const videoId = req.params.videoId;
    
    await CinematicModel.delete(videoId);

    const responseBody = new SuccessResponse({
      "message": "Video Successfully Deleted!"
    }).build();

    res.json(responseBody);
  })
);

router.get(
  '/videos/:userId',
  RequestTimer(),
  AsyncMiddleware(async (req, res, next) => {

    const userId = req.params.userId;
    
    result = await CinematicsService.getVideos(userId);

    if (!result) {
      console.error(
        `Could not find any Cinematic Videos`
      );
      next(new Error('Error finding Cinematic Videos'));
      return;
    }

    const responseBody = new SuccessResponse(result).build();

    res.json(responseBody);
  })
);

function buildClipResponseModel(clip) {
  const returnClip = {
    id: clip.id,
    name: clip.name,
    type: clip.type,
    gameName: clip.game_name,
    tags: clip.tags,
    url: clip.url,
    thumbnailUrl: clip.thumbnail_url,
    createdDate: moment.utc(clip.created_date).format(),
    streamerName: clip.streamer_name,
    gameMode: clip.game_mode,
    streamDate: clip.stream_date,
    duration: clip.metadata.duration,
    cinematicKeyframeNumber: clip.metadata.cinematicKeyframeNumber
  };

  if (clip.user_name) {
    returnClip.owner = {
      id: clip.user_id,
      name: clip.user_name
    };
  }

  if (clip.kill_count) {
    returnClip.killCount = clip.kill_count
  }
  if (clip.kill_distance) {
    returnClip.killDistance = clip.kill_distance
  }
  if (clip.main_weapon) {
    returnClip.weaponType = clip.main_weapon
  }

  return returnClip;
}

async function copyObject(copyFromBucket, FileToCopy, copyToBucket, saveFileAs) {
  
  const params = {
    Bucket: copyToBucket,
    CopySource: copyFromBucket + "/" + FileToCopy,
    Key: saveFileAs
  };
  
  let result;

  try {
    const promisified = util.promisify(s3.copyObject).bind(s3);
    result = await promisified(params);
  } catch (error) {
    console.error('Cannot copy object to AWS S3:', error, params);
    throw new BadGatewayError('Cannot copy object to S3');
  }

  return result;
}

async function putObject(object, key, bucketName) {
  const params = {
    Bucket: bucketName,
    Body: object,
    Key: key
  };
  let result;

  try {
    const promisified = util.promisify(s3.putObject).bind(s3);
    result = await promisified(params);
  } catch (error) {
    console.error('Cannot put object to AWS S3:', error, params);
    throw new BadGatewayError('Cannot put object to S3');
  }

  return result;
}

module.exports = router;
