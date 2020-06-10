const express = require('express');
const dlv = require('dlv');
const router = express.Router();

const UserClipMetadata = require('../models/userClipMetadata');
const AsyncMiddleware = require('../common/middlewares/AsyncMiddleware');
const {authFilter} = require('../common/middlewares/AuthFilter');
const BadRequestError = require('../errors/BadRequestError');
const SuccessResponse = require('../common/SuccessResponse');

router.use(authFilter);

/**
 * Get metadata on a video for ML Emojis
 * Query parameters:
 * 'clipId' (Required, must be a number)
 * 'startFrame' (Optional, must be a number, what frame to start with)
 * 'endFrame' (Optional, must be a number, what frame to end with)
 */
router.get('/', AsyncMiddleware(async (req, res) => {
  if (!validateParameters(req.query)) {
    throw new BadRequestError();
  }

  let {clipId, startFrame=0, endFrame} = req.query;

  const response = await UserClipMetadata.getByClipId(clipId);

  if (!endFrame) {
    // Weird hack to get last item in Object; remove this..
    // Does seem faster though? http://jsben.ch/Rj3OE
    var hack = response.metadata, lastProperty;
    for (lastProperty in hack);
    endFrame = Number(lastProperty.split('_')[1]);
  }

  const output = {};
  const {metadata} = response;

  for (let i = startFrame; i <= endFrame; i++) {
    const key = `frame_${i}`;
    const data = dlv(metadata, key);

    if (data) {
      output[key] = data;
    }
  }

  const frames = new SuccessResponse(output).build();

  res.json(frames);
}));

function validateParameters(params) {
  // TODO: Check ownership of clip?
  if (!params.clipId || isNaN(params.clipId)) {
    return false;
  }

  return true;
}

module.exports = router;
