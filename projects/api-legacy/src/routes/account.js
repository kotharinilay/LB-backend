const express = require('express');
const router = express.Router();

const {authFilter} = require('../common/middlewares/AuthFilter');
const AsyncMiddleware = require('../common/middlewares/AsyncMiddleware');
const SuccessResponse = require('../common/SuccessResponse');
const ProvidersEnum = require('../common/enums/ProvidersEnum');
const RequestTimer = require('../common/middlewares/RequestTimer')

const ACCOUNTS_LIST = Object.values(ProvidersEnum);

router.use(authFilter);

router.get(
  '/',
  RequestTimer(),
  AsyncMiddleware(async (req, res) => {
    const responseBody = new SuccessResponse(ACCOUNTS_LIST).build();
    res.json(responseBody);
  })
);

module.exports = router;
