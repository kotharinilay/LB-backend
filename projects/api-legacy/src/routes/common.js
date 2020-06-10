const express = require('express');
const router = express.Router();

const AsyncMiddleware = require('../common/middlewares/AsyncMiddleware');
const SuccessResponse = require('../common/SuccessResponse');

router.get('/health', AsyncMiddleware(async (req, res) => {
  res.send();
}));

router.get('/status', AsyncMiddleware(async (req, res) => {
  const responseBody = new SuccessResponse({
    'supported': true,
    'latest': true
  }).build();

  res.json(responseBody);
}));

module.exports = router;
