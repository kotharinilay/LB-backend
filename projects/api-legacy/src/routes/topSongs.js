const express = require('express');
const router = express.Router();
const Promise = require('bluebird');

const getRedisClient = require('../services/redis/redisClient');
const getTopTenEDMSongs = require('../api/topSongGenres/edm');
const getTopTenPopSongs = require('../api/topSongGenres/pop');
const {authFilter} = require('../common/middlewares/AuthFilter');
const SuccessResponse = require('../common/SuccessResponse');
const RequestTimer = require('../common/middlewares/RequestTimer')

const EXPIRATION_IN_SECONDS = 60 * 60 * 1000;
const TOP_SONGS_REDIS_KEY = 'topSongs:mvp';

const client = getRedisClient();

router.use(authFilter);

router.get("/", (request, response, next) => {
  getSongs()
    .then((songs) => {
      const responseBody = new SuccessResponse({
        data: songs
      }).build();

      response.json(responseBody);
    })
    .catch((err) => {
      console.error('Error getting top songs', err);
      return next(err);
    });
});

async function getSongs() {
  return new Promise((resolve, reject) => {
    client.get(TOP_SONGS_REDIS_KEY, function(err, response) {
      if (err) {
        reject(err);
      } else {
        resolve(response);
      }
    });
  })
    .then((response) => {
      if (response !== null) {
        return JSON.parse(response);
      }

      return _getSongs();
    })
    .catch((err) => {
      console.error(
        'Error occured attempting to access top songs redis data',
        err
      );

      return _getSongs();
    });
}

async function _getSongs() {
  const edmSongs = await getTopTenEDMSongs();
  const popSongs = await getTopTenPopSongs();

  const songs = edmSongs.concat(popSongs);

  return client.set(
    TOP_SONGS_REDIS_KEY,
    JSON.stringify(songs),
    'EX',
    EXPIRATION_IN_SECONDS,
    function(err) {
      if (err) {
        console.error(err);
      }

      return songs;
    }
  );
}

module.exports = router;