const express = require('express');
const router = express.Router({mergeParams: true});
const moment = require('moment');

const AsyncMiddleware = require('../../common/middlewares/AsyncMiddleware');
const RequestTimer = require('../../common/middlewares/RequestTimer');
const BadRequestError = require('../../errors/BadRequestError');
const NotFoundError = require('../../errors/NotFoundError');
const SuccessResponse = require('../../common/SuccessResponse');
const VideoStatusEnum = require('../../common/enums/VideoStatusEnum');
const VideoTypeEnum = require('../../common/enums/VideoTypeEnum');
const VideoPublishStatusEnum = require('../../common/enums/VideoPublishStatusEnum');
const ProvidersEnum = require('../../common/enums/ProvidersEnum');
const ProviderTypeValidator = require('../../common/validator/ProviderTypeValidator');
const UserVideo = require('../../models/userVideo');
const UserVideoPublish = require('../../models/userVideoPublish');
const FileStorageFacade = require('../../services/storage/FileStorageFacade');
const UserVideoService = require('../../services/UserVideoService');
const UserAccountService = require('../../services/UserAccountService');
const ThumbnailService = require('../../services/ThumbnailService');
const {buildPagingSorting} = require('../../common/PagingSorting');

const ALLOWED_FILE_EXTENSIONS = ['mp4', 'mov'];
const  {fromBody, toBody} = require('./mapper')

router.post(
  '/',
  RequestTimer(),
  AsyncMiddleware(async (req, res) => {
    const requestBody = req.body;
    const userId = req.userId;
    if (!validateCreateRequest(requestBody)) {
      console.error('Cannot create video:', requestBody);
      throw new BadRequestError('Input parameters is not complete or invalid');
    }

    const fileName = requestBody.fileName.trim();
    const fileExtension = getFileExtension(fileName);
    validateFileExtension(fileExtension);

    const video = {
      user_id: userId,
      status: VideoStatusEnum.created,
      type: VideoTypeEnum.postEdited,
      created_date: moment.utc(req.body.createdDate * 1000).format(),
      name: req.body.name.trim(),
      clip_id: req.body.clipId
    };

    updateVideoWithTags(requestBody, video);
    updateVideoWithMetadata(requestBody, video);
    const {url, path} = await FileStorageFacade.getSignedUrlForVideo(
      fileExtension
    );
    video.path = path;
    const videoId = await UserVideo.create(video);

    const responseData = {
      id: videoId,
      url: url
    };

    const responseBody = new SuccessResponse(responseData).build();
    res.json(responseBody);
  })
);

router.post(
  '/ml',
  RequestTimer(),
  AsyncMiddleware(async (req, res) => {
    const requestBody = req.body;
    const userId = req.userId;
    if (!validateMLCreateRequest(requestBody)) {
      console.error('Cannot create video:', requestBody);
      throw new BadRequestError('Input parameters is not complete or invalid');
    }

    const video = fromBody(requestBody)
    updateVideoWithTags(requestBody, video);
    updateVideoWithMetadata(requestBody, video);

    const videoId = await UserVideo.create(video);
    video.id = videoId

    const responseBody = new SuccessResponse(toBody(video)).build();
    res.json(responseBody);
  })
);

router.put(
  '/:videoId/upload',
  RequestTimer('/api/v1/profiles/videos/:videoId/upload'),
  AsyncMiddleware(async (req, res) => {
    const userId = req.userId;
    const videoId = req.params.videoId;
    const video = await UserVideoService.getVideo(videoId, userId, true);

    if (video.status !== VideoStatusEnum.created) {
      console.error('Cannot update video, because it is processed:', videoId);
      throw new BadRequestError('Cannot update video');
    }

    const fileMetadata = await FileStorageFacade.getVideoFileMetadata(
      video.path
    );
    if (fileMetadata.ContentLength <= 0) {
      console.error('Possibly file do not exists:', fileMetadata);
      throw new BadRequestError('Cannot get object data in file storage');
    }

    const metadata = video.metadata || {};
    if (!video.metadata) {
      video.metadata = metadata;
    }
    metadata.size = fileMetadata.ContentLength;
    video.status = VideoStatusEnum.completed;
    video.url = FileStorageFacade.buildVideoUrl(video.path);
    await UserVideo.update(video, ['metadata', 'status', 'url']);

    createThumbnail(video);

    const responseBody = new SuccessResponse(
      buildVideoResponseModel(video)
    ).build();
    res.json(responseBody);
  })
);

router.get(
  '/',
  RequestTimer(),
  AsyncMiddleware(async (req, res) => {
    const userId = req.userId;
    const pagingSorting = buildPagingSorting(req.query);
    const {data: videosPaginated, pagination} = await UserVideo.getByUserId(
      userId,
      pagingSorting
    );

    const videos = videosPaginated.map((video) =>
      buildVideoResponseModel(video)
    );

    const responseBody = new SuccessResponse({
      pagination,
      data: videos
    }).build();
    res.json(responseBody);
  })
);

router.get(
  '/:videoId',
  RequestTimer('/api/v1/profiles/videos/:videoId'),
  AsyncMiddleware(async (req, res) => {
    const userId = req.userId;
    const videoId = req.params.videoId;
    const video = await UserVideoService.getVideo(videoId, userId);

    const responseBody = new SuccessResponse(
      buildVideoResponseModel(video)
    ).build();
    res.json(responseBody);
  })
);

router.put(
  '/:videoId',
  RequestTimer('/api/v1/profiles/videos/:videoId'),
  AsyncMiddleware(async (req, res) => {
    const userId = req.userId;
    if (!validateUpdateRequest(req.body)) {
      console.error('Update video request is not complete:', req.body);
      throw new BadRequestError('Some input parameters empty or invalid');
    }

    const videoId = req.params.videoId;
    const video = await UserVideoService.getVideo(videoId, userId);

    video.tags = extractTags(req.body.tags);
    video.name = req.body.name.trim();
    await UserVideo.update(video, ['tags', 'name']);

    const responseBody = new SuccessResponse(
      buildVideoResponseModel(video)
    ).build();
    res.json(responseBody);
  })
);

router.post(
  '/cinematics/new',
  RequestTimer(),
  AsyncMiddleware(async (req, res, next) => {

    // todo: Grab User ID from Bearer Token
    
    let {name, path, thumbnail_path, url, thumbnail_url, metadata,clip_id, user_id} = req.body;

    if (!name) {
      var msg = "Clip Name is Required";
      console.error(
        msg
      );
      next(new Error(msg));
      return;
    }

    if (!path) {
      var msg = "Video Path is Required";
      console.error(
        msg
      );
      next(new Error(msg));
      return;
    }

    if (!thumbnail_path) {
      var msg = "Thumbnail Path is Required";
      console.error(
        msg
      );
      next(new Error(msg));
      return;
    }

    if (!url) {
      var msg = "Video URL is Required";
      console.error(
        msg
      );
      next(new Error(msg));
      return;
    }

    if (!thumbnail_url) {
      var msg = "Thumbnail URL is Required";
      console.error(
        msg
      );
      next(new Error(msg));
      return;
    }

    if (!metadata) {
      var msg = "Metadata is Required";
      console.error(
        msg
      );
      next(new Error(msg));
      return;
    }

    if (!user_id) {
      var msg = "User ID is Required";
      console.error(
        msg
      );
      next(new Error(msg));
      return;
    }

    const video = {
      user_id: user_id,
      status: "COMPLETED",
      type: "POST_EDITED",
      created_date: moment().format(),
      name: name,
      path: path,
      thumbnail_path: thumbnail_path,
      url: url,
      thumbnail_url: thumbnail_url,
      metadata: metadata,
      clip_id: clip_id,
      tags: {},
    };

    const videoId = await UserVideo.create(video);

    const responseBody = new SuccessResponse({
      message: `User Video has been successfully saved!`,
      id: videoId
    }).build();

    res.json(responseBody);

  })
);

router.post('/:videoId/publish', AsyncMiddleware(async (req, res) => {
  const userId = req.userId;
  const videoId = req.params.videoId;
  const requestBody = req.body;

  validatePublishRequest(requestBody);
  await UserVideoService.getVideo(videoId, userId);
  const {providerType} = requestBody;
  const account = await UserAccountService.getUserAccount(userId, providerType);

  const videoPublish = {
    user_id: userId,
    video_id: videoId,
    provider_type: providerType,
    user_account_id: account.id
  };
  if (providerType === ProvidersEnum.instagram) {
    videoPublish.status = VideoPublishStatusEnum.created;
  } else {
    videoPublish.status = VideoPublishStatusEnum.confirmed;
  }

  UserVideoPublish.create(videoPublish);

  const responseBody = new SuccessResponse().build();
  res.json(responseBody);
}));

router.put(
  '/:videoId/thumbnails',
  RequestTimer('/api/v1/profiles/videos/:videoId/thumbnails'),
  AsyncMiddleware(async (req, res) => {
    const videoId = req.params.videoId;
    const video = await getVideoInternal(videoId);

    if (video.thumbnail_url) {
      console.error(
        'Cannot update video thumbnail, because it is already exist:',
        videoId
      );
      throw new BadRequestError('Cannot update video thumbnail');
    }

    video.thumbnail_url = FileStorageFacade.buildVideoUrl(
      video.thumbnail_path);
    UserVideo.update(video, ['thumbnail_url']);

    const responseBody = new SuccessResponse().build();
    res.json(responseBody);
  })
);

router.delete(
  '/:videoId',
  RequestTimer('/api/v1/profiles/videos/:videoId'),
  AsyncMiddleware(async (req, res) => {
    const userId = req.userId;
    const videoId = req.params.videoId;
    let responseMessage = `Video ${videoId} successfully deleted`;
    try {
      await UserVideoService.getVideo(videoId, userId);
      await UserVideo.delete(videoId);
    } catch(err) {
      if (!err.description || (err.description && err.description !== 'Cannot find video')) {
        console.error(`Error deleting video: ${err}`);
        return next(err);
      }
      responseMessage = `Video ${videoId} has already been deleted`
    }

    const responseBody = new SuccessResponse(responseMessage).build();
    res.json(responseBody);
  })
);

function buildVideoResponseModel(video) {
  const result = {
    id: video.id,
    name: video.name,
    tags: video.tags,
    url: video.url,
    thumbnailUrl: video.thumbnail_url,
    type: video.type,
    createdDate: moment.utc(video.created_date).format(),
    streamerName: video.streamer_name,
    gameMode: video.game_mode,
    streamDate: video.stream_date
  };

  if (video.metadata && video.metadata.duration) {
    result.metadata = {
      duration: video.metadata.duration
    };
  }

  if (video.user_id) {
    result.owner = {
      id: video.user_id,
      name: video.user_name
    }
  }

  return result;
}

function getFileExtension(fileName) {
  return fileName.slice((fileName.lastIndexOf('.') - 1 >>> 0) + 2);
}

function validateFileExtension(extension) {
  if (!ALLOWED_FILE_EXTENSIONS.includes(extension.toLowerCase())) {
    console.error('File extension for video is not allowed:', extension);
    throw new BadRequestError('File extension is not allowed');
  }
}

async function getVideoInternal(id) {
  const video = await UserVideo.getById(id);

  if (!video) {
    console.error('Cannot find video by Id:', id);
    throw new NotFoundError('Cannot find video');
  }

  return video;
}

async function createThumbnail(video) {
  const thumbnailPath = await ThumbnailService.createForVideo(video);
  if (!thumbnailPath) {
    return;
  }

  video.thumbnail_path = thumbnailPath;
  UserVideo.update(video, ['thumbnail_path']);
}

function extractTags(tags) {
  if (!tags) {
    return;
  }

  return tags.map((tag) => tag.trim())
    .filter((tag) => tag.length !== 0);
}

function updateVideoWithTags(requestBody, video) {
  const tags = extractTags(requestBody.tags);

  if (tags) {
    video.tags = tags;
  }
}

function updateVideoWithMetadata(requestBody, video) {
  if (requestBody.metadata && requestBody.metadata.duration) {
    video.metadata = {
      duration: requestBody.metadata.duration
    };
  }
}

function validateMLCreateRequest(requestBody) {
  const {
    name,
    createdDate,
    fileName,
    metadata,
    clipId
  } = requestBody;

  if (!name || name.trim().length === 0) {
    return false;
  }

  if (!createdDate) {
    return false;
  }

  if (metadata && metadata.duration && isNaN(metadata.duration)) {
    return false;
  }

  if (!clipId || isNaN(clipId)) {
    console.error('clipId value not passed (or is not a number) during video creation. Setting to default 2061')
    // Set a default for now until all videos published contain
    // the clipId
    requestBody.clipId = 2061;
  }

  return true;
}

function validateCreateRequest(requestBody) {
  const {
    name,
    createdDate,
    fileName,
    metadata,
    clipId
  } = requestBody;

  if (!name || name.trim().length === 0) {
    return false;
  }

  if (!fileName || fileName.trim().length === 0) {
    return false;
  }

  if (!createdDate) {
    return false;
  }

  if (metadata && metadata.duration && isNaN(metadata.duration)) {
    return false;
  }

  if (!clipId || isNaN(clipId)) {
    console.error('clipId value not passed (or is not a number) during video creation. Setting to default 2061')
    // Set a default for now until all videos published contain
    // the clipId
    requestBody.clipId = 2061;
  }

  return true;
}


function validateUpdateRequest(requestBody) {
  const {name, tags} = requestBody;

  if (!name || name.trim().length === 0 ) {
    return false;
  }

  if (!Array.isArray(tags)) {
    return false;
  }

  return true;
}

function validatePublishRequest(requestBody) {
  const {providerType} = requestBody;
  ProviderTypeValidator.validate(providerType);
}

module.exports = router;
