const express = require('express');
const router = express.Router({mergeParams: true});

const {authFilter} = require('../common/middlewares/AuthFilter');
const AsyncMiddleware = require('../common/middlewares/AsyncMiddleware');
const BadRequestError = require('../errors/BadRequestError');
const SuccessResponse = require('../common/SuccessResponse');
const Game = require('../models/game');
const UserGame = require('../models/userGame');

router.use(authFilter);

router.get('/', AsyncMiddleware(async (req, res) => {
  const userId = req.userId;
  const games = await getGames(userId);

  const responseBody = new SuccessResponse({
    data: games
  }).build();

  res.json(responseBody);
}));

router.get('/:id', AsyncMiddleware(async (req, res) => {
  const userId = req.userId;
  const gameId = req.params.id;
  const game = await getGame(gameId, userId);

  const responseBody = new SuccessResponse(game).build();

  res.json(responseBody);
}));

router.post('/', AsyncMiddleware(async (req, res) => {
  const userId = req.userId;
  const requestBody = req.body;
  await validateCreateRequest(requestBody);
  await checkForGameDuplicates(requestBody, userId);

  const promises = requestBody.gameIds
    .map((gameId) => {
      const userGame = {
        user_id: userId,
        game_id: gameId
      };

      return UserGame.create(userGame);
    });

  const ids = await Promise.all(promises);
  const responseBody = new SuccessResponse({
    data: ids
  })
    .build();
  res.json(responseBody);
}));

router.delete('/:id', AsyncMiddleware(async (req, res) => {
  const userId = req.userId;
  const gameId = req.params.id;
  await deleteGame(gameId, userId);

  const responseBody = new SuccessResponse().build();
  res.json(responseBody);
}));

async function getGames(userId) {
  const games = await UserGame.getByUserId(userId);

  const promises = games.map((game) => {
    return buildGameResponseModel(game)
  });

  return await Promise.all(promises);
}

async function getGame(id, userId) {
  const game = await UserGame.getByIdAndUserId(id, userId);

  if (!game) {
    console.error(`Cannot find game by Id ${id} for user ${userId}`);
    throw new NotFoundError('Cannot find game');
  }

  return buildGameResponseModel(game);
}

async function deleteGame(id, userId) {
  const game = await UserGame.getByIdAndUserId(id, userId);

  if (!game) {
    console.error(`Cannot find game by Id ${id} for user ${userId}`);
    throw new NotFoundError('Cannot find game');
  }

  UserGame.delete(id);
}

async function validateCreateRequest(requestBody) {
  const providedGameIds = requestBody.gameIds;
  if (!Array.isArray(providedGameIds) || providedGameIds.length === 0) {
    console.error('Game Ids not an array:', requestBody);
    throw new BadRequestError('Input parameter is not complete or invalid');
  }

  const gameIdsSet = new Set(providedGameIds);
  const allGames = await Game.getAll();
  allGames.forEach((game) => gameIdsSet.add(game.id));
  if (gameIdsSet.size !== allGames.length) {
    console.error('One of game Id is invalid:', requestBody);
    throw new BadRequestError('Input parameter is not complete or invalid');
  }
}

async function checkForGameDuplicates(requestBody, userId) {
  const gameIds = requestBody.gameIds;
  const count = await UserGame.countByGameIdsAndUserId(gameIds, userId);

  if (count > 0) {
    console.error('Cannot create game duplicate:', requestBody);
    throw new BadRequestError('User already has this game');
  }
}

async function buildGameResponseModel(userGame) {
  const game = await Game.getById(userGame.game_id);

  return {
    id: userGame.id,
    name: game.name,
    thumbnailUrl: game.thumbnail_url
  }
}

module.exports = router;
