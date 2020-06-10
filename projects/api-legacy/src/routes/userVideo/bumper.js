const express = require('express');
const router = express.Router({mergeParams: true});

const moment = require('moment');

const AsyncMiddleware = require('../../common/middlewares/AsyncMiddleware');
const BadRequestError = require('../../errors/BadRequestError');
const NotFoundError = require('../../errors/NotFoundError');
const SuccessResponse = require('../../common/SuccessResponse');
const AccessTypeEnum = require('../../common/enums/AccessTypeEnum');
const BumperTypeEnum = require('../../common/enums/BumperTypeEnum');
const BumperStatusEnum = require('../../common/enums/BumperStatusEnum');
const ThumbnailService = require('../../services/ThumbnailService');
const FileStorageFacade = require('../../services/storage/FileStorageFacade');
const UserBumper = require('../../models/userBumper');
const RequestTimer = require('../../common/middlewares/RequestTimer');

const AWS_S3_REGION = process.env.AWS_S3_REGION;
const AWS_S3_BUCKET_NAME = process.env.AWS_S3_USER_VIDEO_BUCKET_NAME;
const ALLOWED_FILE_EXTENSIONS = ['mp4', 'mov'];

router.get(
  '/upload',
  RequestTimer(),
  AsyncMiddleware(async (req, res) => {
    const userId = req.userId;
    const type = req.query.type;
    const fileExtension = getFileExtension(req.query.fileName);

    validateBumperType(type);
    validateFileExtension(fileExtension);

    const {url, path} = await FileStorageFacade.getSignedUrlForVideoBumper(
      fileExtension
    );
    const bumper = {
      user_id: userId,
      path: path,
      type: type,
      status: BumperStatusEnum.created
    };
    const id = await UserBumper.create(bumper);

    const responseBody = new SuccessResponse({
      id: id,
      url: url
    }).build();
    res.json(responseBody);
  })
);

router.get(
  '/',
  RequestTimer(),
  AsyncMiddleware(async (req, res) => {
    const userId = req.userId;
    const type = req.query.type;

    if (type) {
      validateBumperType(type);
    }
    const bumpers = await getBumpers(userId, type);

    const responseBody = new SuccessResponse({
      data: bumpers
    }).build();
    res.json(responseBody);
  })
);

router.get(
  '/:id',
  RequestTimer('/api/v1/profiles/videos/bumpers/:id'),
  AsyncMiddleware(async (req, res) => {
    const userId = req.userId;
    const bumperId = req.params.id;
    const bumper = await getBumper(bumperId, userId);

    const responseBody = new SuccessResponse(bumper).build();
    res.json(responseBody);
  })
);

router.get(
  '/common/:id',
  RequestTimer('/api/v1/profiles/videos/bumpers/common/:id'),
  AsyncMiddleware(async (req, res) => {
    const bumperId = req.params.id;
    const bumper = await getCommonBumper(bumperId);

    const responseBody = new SuccessResponse(bumper).build();
    res.json(responseBody);
  })
);

router.put(
  '/:id',
  RequestTimer('/api/v1/profiles/videos/bumpers/:id'),
  AsyncMiddleware(async (req, res) => {
    const bumperId = req.params.id;
    const bumper = await getBumperById(bumperId);

    const fileMetadata = await FileStorageFacade.getBumperFileMetadata(
      bumper.path
    );
    if (fileMetadata.ContentLength <= 0) {
      console.error('Possibly file do not exists:', fileMetadata);
      throw new BadRequestError('Cannot get object data in file storage');
    }

    bumper.size = fileMetadata.ContentLength;
    bumper.status = BumperStatusEnum.completed;
    bumper.url = buildFileUrl(bumper.path);
    UserBumper.update(bumper, ['size', 'status', 'url']);
    createThumbnail(bumper);

    const responseBody = new SuccessResponse({
      url: bumper.url,
      status: bumper.status,
      type: bumper.type
    }).build();
    res.json(responseBody);
  })
);

router.put(
  '/:id/thumbnails',
  RequestTimer('/api/v1/profiles/videos/bumpers/:id/thumbnails'),
  AsyncMiddleware(async (req, res) => {
    const bumperId = req.params.id;
    const bumper = await getBumperById(bumperId);

    if (bumper.thumbnail_url) {
      console.error(
        'Cannot update bumper thumbnail, because it is already exist:',
        bumperId
      );
      throw new BadRequestError('Cannot update bumper thumbnail');
    }

    bumper.thumbnail_url = buildFileUrl(bumper.thumbnail_path);
    UserBumper.update(bumper, ['thumbnail_url']);

    const responseBody = new SuccessResponse().build();
    res.json(responseBody);
  })
);

async function getBumper(id, userId) {
  const bumper = await UserBumper.getByIdAndUserId(id, userId);

  if (!bumper) {
    console.error(`Cannot find bumper by Id '${id}' for user '${userId}'`);
    throw new NotFoundError('Cannot find bumper');
  }

  return buildBumperResponseModel(bumper);
}

async function getCommonBumper(id) {
  const bumper = await UserBumper.getCommonById(id);

  if (!bumper) {
    console.error('Cannot find common bumper by Id:', id);
    throw new NotFoundError('Cannot find bumper');
  }
  bumper.access = AccessTypeEnum.common;

  return buildBumperResponseModel(bumper);
}

async function getBumperById(id) {
  const bumper = await UserBumper.getById(id);

  if (!bumper) {
    console.error('Cannot find bumper by Id:', id);
    throw new NotFoundError('Cannot find bumper');
  }

  return bumper;
}

async function getBumpers(userId, type) {
  let bumpers;

  if (type) {
    bumpers = await UserBumper.getAllByUserIdAndType(userId, type);
  } else {
    bumpers = await UserBumper.getAllByUserId(userId);
  }
  return bumpers.map((bumper) => buildBumperResponseModel(bumper));
}

function buildBumperResponseModel(bumper) {
  if (bumper.access === AccessTypeEnum.common) {
    return {
      id: bumper.id,
      type: bumper.type,
      url: bumper.url,
      thumbnailUrl: bumper.thumbnail_url,
      access: AccessTypeEnum.common
    };
  } else {
    return {
      id: bumper.id,
      type: bumper.type,
      url: bumper.url,
      thumbnailUrl: bumper.thumbnail_url,
      createdDate: moment(bumper.created_date).format(),
      access: AccessTypeEnum.private
    };
  }
}

async function createThumbnail(bumper) {
  const thumbnailPath = await ThumbnailService.createForBumper(bumper);
  if (!thumbnailPath) {
    return;
  }

  bumper.thumbnail_path = thumbnailPath;
  UserBumper.update(bumper, ['thumbnail_path']);
}

function getFileExtension(fileName) {
    return fileName.slice((fileName.lastIndexOf(".") - 1 >>> 0) + 2);
}

function buildFileUrl(path) {
    return `https://${AWS_S3_BUCKET_NAME}.s3-${AWS_S3_REGION}.amazonaws.com/${path}`;
}

function validateBumperType(type) {
  if (!BumperTypeEnum.hasValue(type)) {
    console.error('Unknown bumper type:', type);
    throw new BadRequestError('Bumper type is not supported');
  }
}

function validateFileExtension(extension) {
  if (!ALLOWED_FILE_EXTENSIONS.includes(extension.toLowerCase())) {
    console.error('File extension for bumper is not allowed:', extension);
    throw new BadRequestError('File extension is not allowed');
  }
}

module.exports = router;
