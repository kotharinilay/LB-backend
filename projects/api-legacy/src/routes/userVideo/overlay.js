const express = require('express');
const router = express.Router({mergeParams: true});
const moment = require('moment');
const multer = require('multer');

const SuccessResponse = require('../../common/SuccessResponse');
const AccessTypeEnum = require('../../common/enums/AccessTypeEnum');
const AsyncMiddleware = require('../../common/middlewares/AsyncMiddleware');
const RequestTimer = require('../../common/middlewares/RequestTimer');
const FileUploadValidator = require('../../common/validator/FileUploadValidator');
const BadRequestError = require('../../errors/BadRequestError');
const UserOverlayService = require('../../services/UserOverlayService');

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    files: 1,
    fileSize: 1 * 1024 * 1024
  }
});
const fileUpload = upload.fields([{name: 'file', maxCount: 1}]);

router.get(
  '/',
  RequestTimer(),
  AsyncMiddleware(async (req, res) => {
    const userId = req.userId;
    const pagingSorting = buildPagingSorting(req.query);
    const overlaysPaginated = await UserOverlayService.getOverlays(userId,
      pagingSorting);
    const overlays = overlaysPaginated.data.map((overlay) =>
      buildResponseModel(overlay)
    );

    const responseBody = new SuccessResponse({
      data: overlays
    })
      .nextCursor(overlaysPaginated.pagination.nextCursor)
      .build();
    res.json(responseBody);
  })
);

router.get(
  '/recent',
  RequestTimer(),
  AsyncMiddleware(async (req, res) => {
    const userId = req.userId;
    const pagingSorting = buildPagingSorting(req.query);
    const overlaysPaginated = await UserOverlayService.getRecentOverlays(
      userId, pagingSorting
    );
    const overlays = overlaysPaginated.data.map((overlay) =>
      buildResponseModel(overlay)
    );

    const responseBody = new SuccessResponse({
      data: overlays
    })
      .nextCursor(overlaysPaginated.pagination.nextCursor)
      .build();
    res.json(responseBody);
  })
);

router.get(
  '/:id',
  RequestTimer('/api/v1/profiles/videos/overlays/:id'),
  AsyncMiddleware(async (req, res) => {
    const userId = req.userId;
    const overlayId = req.params.id;
    const overlay = await UserOverlayService.getOverlayForUser(overlayId,
      userId);

    const responseBody = new SuccessResponse(
      buildResponseModel(overlay)
    ).build();
    res.json(responseBody);
  })
);

router.get(
  '/common/:id',
  RequestTimer('/api/v1/profiles/videos/overlays/common/:id'),
  AsyncMiddleware(async (req, res) => {
    const overlayId = req.params.id;
    const overlay = await UserOverlayService.getCommonOverlay(overlayId);
    overlay.access = AccessTypeEnum.common;

    const responseBody = new SuccessResponse(
      buildResponseModel(overlay)
    ).build();
    res.json(responseBody);
  })
);

router.post(
  '/',
  RequestTimer(),
  fileUpload,
  AsyncMiddleware(async (req, res) => {
    const userId = req.userId;
    const filesData = req.files.file;
    if (!filesData || filesData.length !== 1) {
      console.log('Cannot upload file:', req.files);
      throw new BadRequestError('Cannot upload file');
    }

    const fileData = filesData[0];
    FileUploadValidator.validateFile(fileData);
    const overlay = await UserOverlayService.addOverlay(userId, fileData);

    const responseBody = new SuccessResponse(
      buildResponseModel(overlay)
    ).build();
    res.json(responseBody);
  })
);

router.put(
  '/:id/recent',
  RequestTimer('/api/v1/profiles/videos/overlays/:id/recent'),
  AsyncMiddleware(async (req, res) => {
    const userId = req.userId;
    const overlayId = req.params.id;
    await UserOverlayService.updateLastUsedDate(overlayId, userId);

    const responseBody = new SuccessResponse().build();
    res.json(responseBody);
  })
);

router.put(
  '/:id/thumbnails',
  RequestTimer('/api/v1/profiles/videos/overlays/:id/thumbnails'),
  AsyncMiddleware(async (req, res) => {
    const overlayId = req.params.id;
    await UserOverlayService.updateThumbnail(overlayId);

    const responseBody = new SuccessResponse().build();
    res.json(responseBody);
  })
);

router.delete(
  '/:id',
  RequestTimer('/api/v1/profiles/videos/overlays/:id'),
  AsyncMiddleware(async (req, res) => {
    const userId = req.userId;
    const overlayId = req.params.id;

    await UserOverlayService.deleteOverlay(overlayId, userId);

    const responseBody = new SuccessResponse().build();
    res.json(responseBody);
  })
);

function buildResponseModel(overlay) {
  if (overlay.access === AccessTypeEnum.common) {
    return {
      id: overlay.id,
      url: overlay.url,
      thumbnailUrl: overlay.thumbnail_url,
      access: AccessTypeEnum.common
    };
  } else {
    return {
      id: overlay.id,
      url: overlay.url,
      thumbnailUrl: overlay.thumbnail_url,
      createdDate: moment(overlay.created_date).format(),
      access: AccessTypeEnum.private
    };
  }
}

function buildPagingSorting(query) {
  return {
    limit: query.limit,
    nextCursor: query.nextCursor,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder
  };
}

module.exports = router;
