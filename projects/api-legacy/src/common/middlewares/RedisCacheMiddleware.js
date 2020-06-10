const {promisify} = require('util');

const getRedisClient = require('../../services/redis/redisClient');

const redisClient = getRedisClient();
const getAsync = promisify(redisClient.get).bind(redisClient);
const setAsync = promisify(redisClient.set).bind(redisClient);

const EXPIRATION_TIME_SECONDS_DEFAULT = 3600;

function redisCache(options = {}) {
  const {
    expirationTime = EXPIRATION_TIME_SECONDS_DEFAULT
  } = options;

  return async function (req, res, next) {
    const key = buildKey(req);
    const value = await getValue(key);
    if (value) {
      res.json(value);
      return;
    }

    const json = res.json;
    res.json = function (body) {
      const value = JSON.stringify(body);
      storeValue(key, value, expirationTime);
      json.call(this, body);
    };

    next();
  }
}

function buildKey(req) {
  return req.originalUrl;
}

async function getValue(key) {
  try {
    const value = await getAsync(key);
    return JSON.parse(value);
  } catch (error) {
    console.warn('Error occurred while getting value from Redis:', error);
  }
}

async function storeValue(key, value, expirationTime) {
  try {
    return setAsync(key, value, 'EX', expirationTime);
  } catch (error) {
    console.warn('Error occurred while setting value to Redis:', error);
  }
}

module.exports = redisCache;
