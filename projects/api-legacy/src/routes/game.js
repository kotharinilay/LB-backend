const express = require('express');
const router = express.Router();

const {authFilter} = require('../common/middlewares/AuthFilter');
const AsyncMiddleware = require('../common/middlewares/AsyncMiddleware');
const BadRequestError = require('../errors/BadRequestError');
const SuccessResponse = require('../common/SuccessResponse');
const Game = require('../models/game');

router.use(authFilter);

router.get('/', AsyncMiddleware(async (req, res) => {
  let query = req.query.query;

  if (query === undefined || query.trim().length === 0) {
    console.error('Query parameter is empty:', query);
    throw new BadRequestError('Query parameter is empty');
  }
  if (query.trim().length === 1) {
    const responseBody = new SuccessResponse({
      data: []
    }).build();
    res.json(responseBody);
    return;
  }

  query = query.trim();
  const games = await Game.getByName(query);
  const responseData = games.map((game) => buildGameResponseModel(game));

  const responseBody = new SuccessResponse({
    data: responseData
  }).build();
  res.json(responseBody);
}));

function buildGameResponseModel(game) {
  return {
    id: game.id,
    name: game.name,
    thumbnailUrl: game.thumbnail_url
  };
}

module.exports = router;
