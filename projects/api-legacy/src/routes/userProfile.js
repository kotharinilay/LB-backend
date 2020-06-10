const express = require('express');
const router = express.Router();
const multer = require('multer');
const moment = require('moment');

const {authFilter} = require('../common/middlewares/AuthFilter');
const FileStorageFacade = require('../services/storage/FileStorageFacade');
const UserService = require('../services/UserService');
const FileUploadValidator = require('../common/validator/FileUploadValidator');
const UserStatusEnum = require('../common/enums/UserStatusEnum');
const User = require('../models/user');
const BadRequestError = require('../errors/BadRequestError');
const NotFoundError = require('../errors/NotFoundError');
const AsyncMiddleware = require('../common/middlewares/AsyncMiddleware');
const SuccessResponse = require('../common/SuccessResponse');
const RequestTimer = require('../common/middlewares/RequestTimer')
const UserVideo = require('../models/userVideo');
const {buildPagingSorting} = require('../common/PagingSorting');


const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    files: 1,
    fileSize: 1 * 1024 * 1024,
  }
});
const fileUpload = upload.fields([{name: 'file', maxCount: 1}]);

router.use(authFilter);

router.get(
  '',
  RequestTimer(),
  AsyncMiddleware(async (req, res) => {
    const user = await UserService.getUser(req.userId);

    const responseBody = getUserResponseBody(user);
    res.json(responseBody);
  })
);

router.get(
  '/:id',
  RequestTimer('/api/v1/profiles/:id'),
  AsyncMiddleware(async (req, res) => {
    const userId = req.params.id;
    const user = await UserService.getUser(userId);

    const responseBody = getUserResponseBody(user);
    res.json(responseBody);
  })
);

router.get(
  '/:user_id/videos',
  RequestTimer(),
  AsyncMiddleware(async (req, res) => {
    const userId = req.params.user_id;
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

router.put(
  '',
  RequestTimer(),
  AsyncMiddleware(async (req, res) => {
    const requestBody = req.body;
    const user = await UserService.getUser(req.userId);

    if (!isUpdateRequestValid(requestBody)) {
      console.error(
        'One of required parameters missing or incorrect:',
        requestBody
      );
      throw new BadRequestError(
        'One of required parameters missing or incorrect'
      );
    }

    user.user_name = requestBody.userName;
    if (requestBody.name) {
      user.name = requestBody.name;
    }
    user.status = UserStatusEnum.completed;
    User.update(user, ['user_name', 'name', 'status']);

    const responseBody = getUserResponseBody(user);
    res.json(responseBody);
  })
);

router.post(
  '/avatar',
  fileUpload,
  RequestTimer(),
  AsyncMiddleware(async (req, res) => {
    const user = await UserService.getUser(req.userId);
    const filesData = req.files.file;
    if (!filesData || filesData.length !== 1) {
      console.log('Cannot upload file:', req.files);
      throw new BadRequestError('Cannot upload file');
    }

    const fileData = filesData[0];
    FileUploadValidator.validateFile(fileData);

    if (user.avatar) {
      await FileStorageFacade.deleteUserAvatar(user.avatar.path);
    }
    const {url, path} = await FileStorageFacade.uploadUserAvatar(
      fileData.originalname,
      fileData.buffer
    );
    user.avatar = {
      url: url,
      path: path
    };
    User.update(user, ['avatar']);

    const responseBody = new SuccessResponse({
      url: url
    }).build();
    res.json(responseBody);
  })
);

router.delete(
  '/avatar',
  RequestTimer(),
  AsyncMiddleware(async (req, res) => {
    const user = await UserService.getUser(req.userId);

    if (user.avatar) {
      FileStorageFacade.deleteUserAvatar(user.avatar.path);
      user.avatar = null;
      await User.update(user, ['avatar']);
    }

    const responseBody = new SuccessResponse().build();
    res.json(responseBody);
  })
);

router.post(
  '/background',
  fileUpload,
  RequestTimer(),
  AsyncMiddleware(async (req, res) => {
    const user = await UserService.getUser(req.userId);
    const filesData = req.files.file;
    if (!filesData || filesData.length !== 1) {
      console.log('Cannot upload file:', req.files);
      throw new BadRequestError('Cannot upload file');
    }

    const fileData = filesData[0];
    FileUploadValidator.validateFile(fileData);

    if (user.background) {
      await FileStorageFacade.deleteUserBackground(user.background.path);
    }
    const {url, path} = await FileStorageFacade.uploadUserBackground(
      fileData.originalname,
      fileData.buffer
    );
    user.background = {
      url: url,
      path: path
    };
    User.update(user, ['background']);

    const responseBody = new SuccessResponse({
      url: url
    }).build();
    res.json(responseBody);
  })
);

router.delete(
  '/background',
  RequestTimer(),
  AsyncMiddleware(async (req, res) => {
    const user = await UserService.getUser(req.userId);

    if (user.background) {
      FileStorageFacade.deleteUserBackground(user.background.path);
      user.background = null;
      await User.update(user, ['background']);
    }

    const responseBody = new SuccessResponse().build();
    res.json(responseBody);
  })
);

function isNotEmpty(obj) {
    return obj && obj !== 'null' && obj !== 'undefined';
}

function isUpdateRequestValid(requestBody) {
  return isNotEmpty(requestBody.userName);
}

function getUserResponseBody(user) {
  const result = {
    email: user.email,
    userName: user.user_name,
    name: user.name,
    status: user.status
  };

  if (user.avatar) {
    result.avatar = user.avatar.url
  }

  if (user.background) {
    result.background = user.background.url
  }

  return result;
}

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

module.exports = router;
