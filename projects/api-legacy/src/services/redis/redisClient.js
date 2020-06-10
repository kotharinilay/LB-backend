const redis = require('redis');
const REDIS_SERVER_URL = process.env.REDIS_SERVER_URL;
const MAX_RETRY_COUNT = process.env.MAX_RETRY_COUNT || 3;
let client;

function getClient() {
  if (client && client.connected) {
    return client;
  }
  // enable_offline_queue = false does this:
  //  "Continue to attempt to re-connect to my Redis server based on
  //  the retry_strategy function, but immediately throw errors in
  //  response to attempts to use the client in the meantime. Then,
  //  if able to reconnect, just start working again".
  client = redis.createClient({
    url: REDIS_SERVER_URL,
    enable_offline_queue: false,
    retry_strategy: (options) => {
      if (options.times_connected > MAX_RETRY_COUNT) {
        return new Error('Error reconnecting to redis client');
      }

      // Retry time in ms
      return 1000;
    }
  });

  return client;
}

module.exports = getClient;

