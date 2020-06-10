const express = require('express');
const router = express.Router({mergeParams: true});

const util = require('util');
const AWS = require('aws-sdk');
const moment = require('moment');

const AsyncMiddleware = require('../../common/middlewares/AsyncMiddleware');
const RequestTimer = require('../../common/middlewares/RequestTimer');
const BadRequestError = require('../../errors/BadRequestError');
const NotFoundError = require('../../errors/NotFoundError');
const BadGatewayError = require('../../errors/BadGatewayError');
const SuccessResponse = require('../../common/SuccessResponse');
const ClipTypeEnum = require('../../common/enums/ClipTypeEnum');
const ClipStatusEnum = require('../../common/enums/ClipStatusEnum');
const UserClip = require('../../models/userClip');
const UserClipMetadata = require('../../models/userClipMetadata');
const FileStorageFacade = require('../../services/storage/FileStorageFacade');
const UserClipService = require('../../services/UserClipService');
const ThumbnailService = require('../../services/ThumbnailService');
const {buildPagingSorting} = require('../../common/PagingSorting');

const ALLOWED_FILE_EXTENSIONS = ['mp4', 'mov'];

const AWS_S3_REGION = process.env.AWS_S3_REGION;
const AWS_S3_AUTO_CLIP_BUCKET_NAME = process.env.AWS_S3_AUTO_CLIP_BUCKET_NAME;
const AWS_S3_USER_VIDEO_BUCKET_NAME = process.env.AWS_S3_USER_VIDEO_BUCKET_NAME;
const AWS_S3_LAMBDA_VIDEO_EDITOR_BUCKET_NAME = process.env.AWS_S3_LAMBDA_VIDEO_EDITOR_BUCKET_NAME;
const AWS_S3_LAMBDA_CLIPS_MANUAL = process.env.AWS_S3_LAMBDA_CLIPS_MANUAL;

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_CREDENTIALS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_CREDENTIALS_SECRET_KEY,
  region: AWS_S3_REGION
});

const SORT_BY_FIELDS_MAP = new Map([
  ['gameName', 'game_name'], ['timestamp', 'created_date']
]);

router.post(
  '/:channelId/clips',
  RequestTimer('/api/v1/profiles/channels/:channelId/clips'),
  AsyncMiddleware(async (req, res) => {
    const userId = req.userId;
    const action = req.query.action;
    const channelId = req.params.channelId;
    const requestBody = req.body;
    const {gameName, streamerName, streamDate} = requestBody;
    const type = getClipType(action);

    let clip;
    let responseData = {};
    if (action === 'copy') {
      clip = await copyClip(userId, requestBody.sourceId);
      responseData.id = await UserClip.create(clip);
    } else if (type === ClipTypeEnum.manual) {
      if (!validateCreateManualClipRequest(requestBody)) {
        console.error('Cannot create manual clip:', requestBody);
        throw new BadRequestError(
          'Input parameters is not complete or invalid'
        );
      }

      // Create clip object
      clip = {
        user_id: userId,
        type: type,
        status: ClipStatusEnum.created,
        created_date: moment.utc(Date.now() * 1000).format(),
        game_name: gameName,
        channel_id: channelId,
        streamer_name: streamerName,
        stream_date: streamDate
      };

      // Update name and tags
      if (req.body.name && req.body.name.trim().length > 0) {
        clip.name = req.body.name.trim();
      }
      updateClipWithTags(requestBody, clip);

      // If segments are available upload to lamda-clips-manual, and lambda will process
      if (requestBody.streamUri) {
        const clipId = await UserClip.create(clip);
        let lambdaObject = {clipId, 
                            userId, 
                      streamerName, 
                         channelId, 
                          gameName, 
                         streamUri: requestBody.streamUri,
                      secondsStart: requestBody.secondsStart,
                        secondsEnd: requestBody.secondsEnd
                        }
        if (clip.name) {
          lambdaObject.name = clip.name
        }

        // Put the json to S3
        await putObject(lambdaObject, `MANUAL_CLIP_${userId}_${clipId}.json`, AWS_S3_LAMBDA_CLIPS_MANUAL)
        responseData = lambdaObject
      } else {
        // Generate a pre-signed URL and client will upload video to that url
        const fileExtension = getFileExtension(requestBody.fileName);
        validateFileExtension(fileExtension);  
        const {url, path} = await FileStorageFacade.getSignedUrlForClip(
          fileExtension,
          channelId
        );
        clip.path = path;
        responseData.url = url;  
        responseData.id = await UserClip.create(clip);
      }
    } else {
      console.error('Allow only to create manual clips:', requestBody);
      throw new BadRequestError('Not allowed');
    }

    const responseBody = new SuccessResponse(responseData).build();
    res.json(responseBody);
  })
);

router.put(
  '/:channelId/clips/:clipId/upload',
  RequestTimer('/api/v1/profiles/channels/:channelId/clips/:clipId/upload'),
  AsyncMiddleware(async (req, res) => {
    const userId = req.userId;
    const clipId = req.params.clipId;
    const channelId = req.params.channelId;
    const clip = await UserClipService.getClipByIdAndUserId(
      clipId,
      userId,
      true
    );

    if (clip.status !== ClipStatusEnum.created) {
      console.error('Cannot update clip, because it is processed:', clipId);
      throw new BadRequestError('Cannot update clip');
    }

    const fileMetadata = await FileStorageFacade.getClipFileMetadata(
      clip.path,
      clip.type
    );

    if (fileMetadata.ContentLength <= 0) {
      console.error(`Possibly clip '${clipId}' file not exist:`, fileMetadata);
      throw new BadRequestError('Cannot get object data in file storage');
    }

    const metadata = clip.metadata || {};
    if (!clip.metadata) {
      clip.metadata = metadata;
    }

    metadata.size = fileMetadata.ContentLength;
    clip.status = ClipStatusEnum.completed;
    clip.url = buildClipUrl(clip.path);
    await UserClip.update(clip, ['metadata', 'status', 'url']);

    createThumbnail(channelId, clip);

    const responseBody = new SuccessResponse(
      buildClipResponseModel(clip)
    ).build();
    res.json(responseBody);
  })
);

router.get(
  '/:channelId/clips/:clipId',
  RequestTimer('/api/v1/profiles/channels/:channelId/clips/:clipId'),
  AsyncMiddleware(async (req, res) => {
    const userId = req.userId;
    const clipId = req.params.clipId;
    const clip = await UserClipService.getClipByIdAndUserId(clipId, userId);

    const responseBody = new SuccessResponse(
      buildClipResponseModel(clip)
    ).build();
    res.json(responseBody);
  })
);

router.get(
  '/clips',
  RequestTimer(),
  AsyncMiddleware(async (req, res) => {
    const userId = req.userId;
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
    const game = req.query.game;

    // let clipsPaginated;
    // let pagination

    // if (tag) {
    //   let {data: clips, pagination: _pagination} = await getClipsDataPaginatedByTag(
    //     userId,
    //     tag,
    //     pagingSorting
    //   );

    //   clipsPaginated = clips;
    //   pagination = _pagination;
    // } else if (name) {
    //   let {data: clips, pagination: _pagination} = await getClipsDataPaginatedByName(
    //     userId,
    //     name,
    //     pagingSorting
    //   );

    //   clipsPaginated = clips;
    //   pagination = _pagination;
    // } else {
    //   let {data: clips, pagination: _pagination} = await UserClip.getByUserId(
    //     userId,
    //     pagingSorting
    //   );

    //   clipsPaginated = clips;
    //   pagination = _pagination;
    // }

    let response = await getClipsDataPaginatedByTagByNameByTime(
      userId,
      tag,
      name,
      killCount,
      killDistance,
      weaponType,
      streamer,
      gameMode,
      fromTime,
      toTime,
      game,
      pagingSorting
    );

    const clips = response.data.map((clip) =>
      buildClipResponseModel(clip)
    );

    const responseBody = new SuccessResponse({
      pagination: response.pagination,
      data: clips
    }).build();
    res.json(responseBody);
  })
);

router.get(
  '/clips/manual',
  RequestTimer(),
  AsyncMiddleware(async (req, res) => {
    const userId = req.userId;
    const pagingSorting = buildPagingSorting(req.query);

    const {
      data: clipsDataPaginated,
      pagination
    } = await UserClip.getByUserIdAndType(
      userId,
      ClipTypeEnum.manual,
      pagingSorting
    );

    const clips = clipsDataPaginated.map((clip) =>
      buildClipResponseModel(clip)
    );

    const responseBody = new SuccessResponse({
      pagination,
      data: clips
    }).build();
    res.json(responseBody);
  })
);

router.get(
  '/clips/auto',
  RequestTimer(),
  AsyncMiddleware(async (req, res) => {
    const userId = req.userId;
    const pagingSorting = buildPagingSorting(req.query);

    const {
      data: clipsDataPaginated,
      pagination
    } = await UserClip.getByUserIdAndType(
      userId,
      ClipTypeEnum.auto,
      pagingSorting
    );

    const clips = clipsDataPaginated.map((clip) =>
      buildClipResponseModel(clip)
    );

    const responseBody = new SuccessResponse({
      pagination,
      data: clips
    }).build();
    res.json(responseBody);
  })
);

router.get(
  '/clips/tags',
  RequestTimer(),
  AsyncMiddleware(async (req, res) => {
    const userId = req.userId;
    let tag = req.query.query ? req.query.query.trim() : null
    const pagingSorting = buildPagingSorting(req.query);

    // Return top tags if query is not specified
    if (!tag) {
      UserClip.getTopTags(userId, pagingSorting).then(        
        (topTagsPaginated) => {
          const responseBody = new SuccessResponse({
            data: topTagsPaginated.data, pagination: topTagsPaginated.pagination
          }).build();
          res.json(responseBody);
        }
      );

      return;
    }

    if (tag.length === 1) {
      const responseBody = new SuccessResponse({
        data: []
      }).build();
      res.json(responseBody);
      return;
    }

    UserClip.getByUserIdAndTagQuery(userId, tag, pagingSorting).then(
      (clipsDataPaginated) => {
        const tags = getMatchedTags(clipsDataPaginated.data, tag);
        const responseBody = new SuccessResponse({
          data: tags
        }).build();
        res.json(responseBody);
      }
    );
  })
);

router.get(
  '/clips/games',
  RequestTimer(),
  AsyncMiddleware(async (req, res) => {
    
    const userId = req.userId;
    const pagingSorting = buildPagingSorting(req.query);
    
    let topTagsPaginated = await UserClip.getTopGames(userId, pagingSorting);

    const responseBody = new SuccessResponse({
      data: topTagsPaginated.data, pagination: topTagsPaginated.pagination
    }).build();

    res.json(responseBody);

  })
);


// Gets a list of streamers the user has indexed
router.get(
  '/clips/streamers',
  RequestTimer('/api/v1/profiles/channels/clips/streamers'),
  AsyncMiddleware(async (req, res) => {
    const userId = req.userId;
    const streamers = await UserClipService.getStreamers(userId);

    const responseBody = new SuccessResponse(streamers).build();
    res.json(responseBody);
  })
);

router.get(
  '/clips/:clipId',
  RequestTimer(),
  AsyncMiddleware(async (req, res) => {
    const clipId = req.params.clipId;
    const clip =  await UserClipService.getClipById(clipId);

    const responseBody = new SuccessResponse(
        req.userId ? buildClipResponseModel(clip) : {...buildClipResponseModel(clip), user_id: clip.user_id}
      ).build();
      res.json(responseBody);
    })
);

router.post(
  '/clips/:clipId/enhance',
  RequestTimer('/api/v1/profiles/channels/clips/:clipId/enhance'),
  AsyncMiddleware(async (req, res) => {
    const clipId = req.params.clipId;
    const clip = await UserClipService.getClipById(clipId);

    if (!clip) {
      throw new BadRequestError('Clip not found');
    }

    if (!clip.path) {
      console.error('No path found for clip:', clipId);
      throw new BadRequestError('Clip path not found');
    }
    
    var enhanceObject = {clip_id: clipId, path: clip.path}
    const userId = req.userId || req.body.userId
    if (userId) {
      enhanceObject.user_id = userId
    }
    if (clip.user_id) {
      enhanceObject.clip_user_id = clip.user_id
    }

    const fileName = userId ? `Enhance_${userId}_${clipId}.json` : `Enhance_${clipId}.json`    
    await putObject(enhanceObject, 
                fileName, 
                AWS_S3_LAMBDA_VIDEO_EDITOR_BUCKET_NAME)

                
    const responseBody = new SuccessResponse(
      enhanceObject
    ).build();
    res.json(responseBody);
  })
);

router.put(
  '/:channelId/clips/:clipId',
  RequestTimer('/api/v1/profiles/channels/:channelId/clips/:clipId'),
  AsyncMiddleware(async (req, res) => {
    const userId = req.userId;
    if (!validateUpdateRequest(req.body)) {
      console.error('Update clip request is not complete:', req.body);
      throw new BadRequestError('Some input parameters empty or invalid');
    }

    const clipId = req.params.clipId;
    const clip = await UserClipService.getClipByIdAndUserId(clipId, userId);

    clip.tags = extractTags(req.body.tags);
    clip.name = req.body.name.trim();
    clip.game_name = req.body.gameName.trim();
    await UserClip.update(clip, ['tags', 'name', 'game_name']);

    const responseBody = new SuccessResponse().build();
    res.json(responseBody);
  })
);

router.put(
  '/:channelId/clips/:clipId/thumbnails',
  RequestTimer('/api/v1/profiles/channels/:channelId/clips/:clipId/thumbnails'),
  AsyncMiddleware(async (req, res) => {
    const clipId = req.params.clipId;
    const clip = await UserClipService.getClipById(clipId);

    if (clip.thumbnail_url) {
      console.error(
        'Cannot update clip thumbnail, because it is already exist:',
        clipId
      );
      throw new BadRequestError('Cannot update clip thumbnail');
    }

    clip.thumbnail_url = buildClipUrl(clip.thumbnail_path);
    UserClip.update(clip, ['thumbnail_url']);

    const responseBody = new SuccessResponse().build();
    res.json(responseBody);
  })
);

router.delete(
  '/:channelId/clips/:clipId',
  RequestTimer('/api/v1/profiles/channels/:channelId/clips/:clipId'),
  AsyncMiddleware(async (req, res) => {
    const userId = req.userId;
    const clipId = req.params.clipId;
    await UserClipService.deleteClipByIdAndUserId(clipId, userId);

    const responseBody = new SuccessResponse().build();
    res.json(responseBody);
  })
);

router.get('/:channelId/clips/:clipId/frames',
  AsyncMiddleware(async (req, res) => {
    const userId = req.userId;
    const clipId = req.params.clipId;
    const {
      startFrame = 0,
      endFrame = Number.MAX_SAFE_INTEGER
    } = req.query;
    if (!validateGetFramesRequest(req.query)) {
      console.error('Get clip frames request is not complete:', req.query);
      throw new BadRequestError('Some input parameters empty or invalid');
    }
    await UserClipService.getClipById(clipId);
    const frames = await getClipFrames(clipId, startFrame, endFrame);

    const responseBody = new SuccessResponse({
      data: frames
    }).build();
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
    timestamp: moment.utc(clip.created_date).unix(),
    createdDate: moment.utc(clip.created_date).format(),
    streamerName: clip.streamer_name,
    gameMode: clip.game_mode,
    streamDate: clip.stream_date,
    metadata: clip.metadata
  };

  // This is kind of some tech debt, we always have this stuff
  // and shouldn't be putting it in a separate object really.
  // Sync with the front end and see if we can remove this.
  //if (clip.user_name) {
    returnClip.owner = {
      id: clip.user_id || null,
      user_name: clip.user_name || null,
      email: clip.email || null,
      profile: clip.avatar ? clip.avatar.url : null,
      name: clip.username || null,
    }
  //}

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

function getFileExtension(fileName) {
  return fileName.slice((fileName.lastIndexOf('.') - 1 >>> 0) + 2);
}

function validateFileExtension(extension) {
  if (!ALLOWED_FILE_EXTENSIONS.includes(extension.toLowerCase())) {
    console.error('File extension for clip is not allowed:', extension);
    throw new BadRequestError('File extension is not allowed');
  }
}

function buildClipUrl(path) {
  return FileStorageFacade.buildManualClipUrl(path);
}

async function createThumbnail(channelId, clip) {
  const thumbnailPath = await ThumbnailService.createForClip(channelId, clip);
  if (!thumbnailPath) {
    return;
  }

  clip.thumbnail_path = thumbnailPath;
  UserClip.update(clip, ['thumbnail_path']);
}

function generateFileName() {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}

function getMatchedTags(clips, query) {
  const tagsSet = new Set();

  clips.forEach((clip) => {
    const tags = clip.tags;
    tags.forEach((tag) => {
      const lowercaseTag = tag.toLowerCase();
      if (lowercaseTag.startsWith(query)) {
        tagsSet.add(tag);
      }
    });
  });

  return Array.from(tagsSet).sort();
}

async function getClipsDataPaginatedByTag(userId, tag, pagingSorting) {
  if (tag.trim().length < 2) {
    return {
      data: [],
      pagination: {}
    };
  }

  return UserClip.getByUserIdAndTagQuery(userId, tag, pagingSorting);
}

async function getClipsDataPaginatedByTagByNameByTime(userId, tag, name, killCount, killDistance, weaponType, streamer, gameMode, fromTime, toTime, game, pagingSorting) {
  return UserClip.getClipsDataPaginatedByTagByNameByTime(userId, tag, name, killCount, killDistance, weaponType, streamer, gameMode, fromTime, toTime, game, pagingSorting);
}

async function getClipsDataPaginatedByName(userId, name, pagingSorting) {
  if (name.trim().length < 2) {
    return {
      data: [],
      pagination: {}
    };
  }

  return UserClip.getByUserIdAndNameQuery(userId, name, pagingSorting);
}

function validateUpdateRequest(requestBody) {
  const {name, tags, gameName} = requestBody;

  if (!name || name.trim().length === 0 ) {
    return false;
  }

  if (!Array.isArray(tags)) {
    return false;
  }

  if (!gameName || gameName.trim().length === 0 ) {
    return false;
  }

  return true;
}

function extractTags(tags) {
  if (!tags) {
    return;
  }

  return tags.map((tag) => tag.trim())
    .filter((tag) => tag.length !== 0);
}

function updateClipWithTags(requestBody, clip) {
  const tags = extractTags(requestBody.tags);

  if (tags) {
    clip.tags = tags;
  }
}

function getClipType(action) {
  let type;

  if (action === 'uploadManual') {
    type = ClipTypeEnum.manual;
  } else {
    type = ClipTypeEnum.auto;
  }

  return type;
}

async function copyClip(userId, sourceId) {
  const sourceClip = await UserClipService.getClipByIdAndUserId(sourceId,
    userId);
  const clipFileName = generateFileName() + '.' +
    getFileExtension(sourceClip.path);
  const thumbnailFileName = generateFileName() + '.' +
    getFileExtension(sourceClip.thumbnail_path);
  const clipPath = replaceFileNameInPath(sourceClip.path, clipFileName);
  const thumbnailPath = replaceFileNameInPath(
    sourceClip.thumbnail_path, thumbnailFileName
  );
  const clipUrl = replaceFileNameInPath(sourceClip.url, clipFileName);
  let thumbnailUrl = null;
  if (sourceClip.thumbnail_url) {
    thumbnailUrl = replaceFileNameInPath(
      sourceClip.thumbnail_url, thumbnailFileName
    );
  }

  const targetClip = {
    ...sourceClip,
    url: clipUrl,
    path: clipPath,
    thumbnail_path: thumbnailPath,
    thumbnail_url: thumbnailUrl,
    created_date: moment.utc().format()
  };
  delete targetClip.id;

  const promises = [];
  promises.push(copyFile(sourceClip.path, targetClip.path, sourceClip.type));
  if (sourceClip.thumbnail_url) {
    promises.push(
      copyFile(sourceClip.thumbnail_path, targetClip.thumbnail_path,
        sourceClip.type)
    );
  }
  await Promise.all(promises);

  return targetClip;
}

async function copyFile(sourcePath, targetPath, type) {
  const bucketName = getClipBucket(type);
  const params = {
    Bucket: bucketName,
    CopySource: bucketName + '/' + encodeURIComponent(sourcePath),
    Key: targetPath
  };
  let result;

  try {
    const promisified = util.promisify(s3.copyObject).bind(s3);
    result = await promisified(params);
  } catch (error) {
    console.error('Cannot copy file on AWS S3:', error, params);
    throw new BadGatewayError('Cannot make clip copy');
  }

  return result;
}

async function putObject(object, key, bucketName) {
  const params = {
    Bucket: bucketName,
    Body: JSON.stringify(object),
    Key: key,
    ContentType: "application/json"
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

function replaceFileNameInPath(path, fileName) {
  const index = path.lastIndexOf('/');
  return path.substring(0, index + 1) + fileName;
}

function validateCreateManualClipRequest(requestBody) {
  if (!(requestBody.fileName || requestBody.streamUri)) {
    return false;
  }

  return true;
}

function validateGetFramesRequest(query) {
  const {startFrame, endFrame} = query;
  if (startFrame && (isNaN(startFrame) || startFrame < 0)) {
    return false;
  }
  if (endFrame && (isNaN(endFrame) || endFrame < 0)) {
    return false;
  }

  return true;
}

async function getClipFrames(clipId, startFrame, endFrame) {
  const clipMetadata = await UserClipMetadata.getByClipId(clipId);
  return clipMetadata;
}

function getClipBucket(type) {
  return type === ClipTypeEnum.manual ?
    AWS_S3_USER_VIDEO_BUCKET_NAME :
    AWS_S3_AUTO_CLIP_BUCKET_NAME;
}

module.exports = router;
