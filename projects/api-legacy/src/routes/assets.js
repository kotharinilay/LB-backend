const express = require('express');
const router = express.Router({mergeParams: true});

const AsyncMiddleware = require('../common/middlewares/AsyncMiddleware');
const {authFilter}= require('../common/middlewares/AuthFilter');
const RequestTimer = require('../common/middlewares/RequestTimer');
const SuccessResponse = require('../common/SuccessResponse');
const BRoll = require('../models/broll');
const {buildPagingSorting} = require('../common/PagingSorting');

router.use(authFilter);

router.get(
  '/',
  RequestTimer(),
  AsyncMiddleware(async (req, res, next) => {

    const tag = req.query.tag;
    const type = req.query.type;
    const search = req.query.search;
    const pagingSorting = buildPagingSorting(req.query);
    
    const {
        data: assets,
        pagination
      } = await BRoll.getByTypeAndTags(
        tag,
        type,
        search,
        pagingSorting
      );
      
      const responseBody = new SuccessResponse({
        pagination,
        data: assets
      }).build();

      res.json(responseBody);    
  })
);

router.get(
  '/tags',
  RequestTimer(),
  AsyncMiddleware(async (req, res, next) => {

    const type = req.query.type;

    const topTags = await BRoll.getTopTags(type);

    const responseBody = new SuccessResponse({
      data: topTags.data
    }).build();

    res.json(responseBody);


  })
);

module.exports = router;
