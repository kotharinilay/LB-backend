const express = require('express');
const router = express.Router();

const {authFilter} = require('../common/middlewares/AuthFilter');
const UserService = require('../services/UserService');
const User = require('../models/user');
const BadRequestError = require('../errors/BadRequestError');
const AsyncMiddleware = require('../common/middlewares/AsyncMiddleware');
const SuccessResponse = require('../common/SuccessResponse');
const ColorSchemeEnum = require('../common/enums/ColorSchemeEnum');
const RequestTimer = require('../common/middlewares/RequestTimer')

const CAPTURE_DELAY_MIN_VALUE = 0;
const CAPTURE_DELAY_MAX_VALUE = 20;

router.use(authFilter);

router.get(
  '',
  RequestTimer(),
  AsyncMiddleware(async (req, res) => {
    const userId = req.userId;
    const user = await UserService.getUser(userId);

    const responseBody = new SuccessResponse(user.settings).build();
    res.json(responseBody);
  })
);

router.put(
  '',
  RequestTimer(),
  AsyncMiddleware(async (req, res) => {
    const userId = req.userId;
    const user = await UserService.getUser(userId);
    const requestBody = req.body;

    if (!validateUpdateRequest(requestBody)) {
      console.error('Request to update settings is not correct:', requestBody);
      throw new BadRequestError('Some input parameters empty or incorrect');
    }

    await updateSettings(userId, user, requestBody);
    res.send();
  })
);

function validateUpdateRequest(requestBody) {
  const {captureDelayBefore, captureDelayAfter, colorScheme} = requestBody;

  if (isNaN(captureDelayBefore) || isNaN(captureDelayAfter)) {
    console.error('Incorrect capture delay values');
    return false;
  }

  const before = parseInt(captureDelayBefore, 10);
  const after = parseInt(captureDelayAfter, 10);
  if (!(validateCaptureDelay(before) && validateCaptureDelay(after))) {
    console.error('Capture delay values out of range');
    return false;
  }

  if (colorScheme !== undefined && !ColorSchemeEnum.hasValue(colorScheme)) {
    console.error('Color scheme is incorrect');
    return false;
  }

  return true;
}

function validateCaptureDelay(delay) {
  return delay >= CAPTURE_DELAY_MIN_VALUE && delay <= CAPTURE_DELAY_MAX_VALUE;
}

async function updateSettings(userId, user, requestBody) {
  const settings = user.settings;
  const {captureDelayBefore, captureDelayAfter, colorScheme} = requestBody;
  const before = parseInt(captureDelayBefore, 10);
  const after = parseInt(captureDelayAfter, 10);

  settings.captureDelayBefore = before;
  settings.captureDelayAfter = after;

  if (colorScheme !== undefined) {
    settings.colorScheme = colorScheme;
  } else {
    delete settings.colorScheme;
  }

  return User.update(user, ['settings']);
}

module.exports = router;
