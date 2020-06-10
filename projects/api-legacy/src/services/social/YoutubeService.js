const axios = require('axios');
const qs = require('qs');

const getRedisClient = require('../redis/redisClient');
const ProvidersEnum = require('../../common/enums/ProvidersEnum');
const ProviderVideoTypeEnum = require('../../common/enums/ProviderVideoTypeEnum');

const YOUTUBE_VOD_CACHE_TIME_SECONDS = parseInt(process.env.YOUTUBE_VOD_CACHE_TIME_SECONDS, 10);
const YOUTUBE_LIVE_CACHE_TIME_SECONDS = parseInt(process.env.YOUTUBE_LIVE_CACHE_TIME_SECONDS, 10);
const DEFAULT_LIMIT = 10;
const API_KEY = process.env.YOUTUBE_API_KEY;
const API_BASE_URL = process.env.YOUTUBE_API_BASE_URL;

const INGEST_GAME_NAME_EXPIRATION = 86400; // 24 hrs in seconds

class YoutubeService {
  constructor() {
    this.redisClient = getRedisClient();
  }

  async getVideos(channelId, pagingSorting) {
    const queryParameters = buildGetVideosQueryParameters(
      channelId,
      pagingSorting
    );

    const url = `${API_BASE_URL}/youtube/v3/search?${queryParameters}`;

    return new Promise((resolve, reject) => {
      this.redisClient.get(url, function(err, response) {
        if (err) {
          reject(err);
        } else {
          resolve(response);
        }
      });
    })
      .then((response) => {
        if (response) {
          return JSON.parse(response);
        }

        return this._getVideos(url);
      })
      .catch((err) => {
        console.error(
          'Error occured attempting to access redis data during YoutubeService.getVideos',
          err
        );

        return this._getVideos(url);
      });
  }

  _getVideos(url) {
    return axios
      .get(url)
      .then((response) => {
        const videoItems = response.data.items;
        const nextCursor = response.data.nextPageToken;

        console.log("videoItems:", videoItems)

        const videos = videoItems.map((video) => {
          return convertVideoDataModel(video, ProviderVideoTypeEnum.archive);
        });
        const returnData = {
          data: videos,
          pagination: {
            nextCursor: nextCursor
          }
        };

        this.setDataInRedis(
          url,
          returnData,
          YOUTUBE_VOD_CACHE_TIME_SECONDS
        );

        return returnData;
      })
      .catch((error) => {
        console.error(
          'Error occurred while perform video listing from YouTube',
          error
        );
        return {
          data: [],
          pagination: {}
        };
      });
  }

  async getLiveStreams(channelId) {
    const queryParameters = qs.stringify({
      type: 'video',
      part: 'snippet',
      maxResults: 20,
      channelId: channelId,
      eventType: 'live',
      order: 'date',
      key: API_KEY
    });

    const url = `${API_BASE_URL}/youtube/v3/search?${queryParameters}`;

    return new Promise((resolve, reject) => {
      this.redisClient.get(url, function(err, response) {
        if (err) {
          reject(err);
        } else {
          resolve(response);
        }
      });
    })
      .then((response) => {
        if (response) {
          return JSON.parse(response);
        }

        return this._getLiveStreams(url);
      })
      .catch((err) => {
        console.error(
          'Error occured attempting to access redis data during YoutubeService.getLiveStreams',
          err
        );

        return this._getLiveStreams(url);
      });
  }

  async _getLiveStreams(url) {
    return axios
      .get(url)
      .then((response) => {
        const videos = response.data.items;
        const returnData = videos.map((video) => {
          return convertVideoDataModel(video, ProviderVideoTypeEnum.live);
        });

        this.setDataInRedis(
          url,
          returnData,
          YOUTUBE_LIVE_CACHE_TIME_SECONDS
        );

        return returnData;
      })
      .catch((error) => {
        console.error(
          'Error occurred while perform live videos listing from YouTube',
          error
        );
        return [];
      });
  }

async getGameName(sourceUrl) {

  var redisUrl = sourceUrl + "/game"

  console.log("sourceUrl:", sourceUrl)

  // search in redis cache
  return new Promise((resolve, reject) => {
    this.redisClient.get(redisUrl, function (err, response) {
      if (err) {
        reject(err);
      } else {
        resolve(response);
      }
    });
  })
    .then((response) => {

      if (response) {
        return JSON.parse(response)
      }

      return this._getGameName(sourceUrl)
      
    })
    .catch((err) => {
      
      console.error(
        "Error: Could not get game name from Twitch/Redis",
        err
      );

      return this._getGameName(sourceUrl)
      
    });
}

async _getGameName(sourceUrl) {

  var gameName = "";

  const puppeteer = require('puppeteer');

  return await (async () => {
      // set some options (set headless to false so we can see 
      // this automated browsing experience)
      let launchOptions = {
        executablePath: '/usr/bin/chromium-browser',
        args: [
          '--start-maximized',
          '--no-sandbox', 
          '--headless', 
          '--disable-gpu', 
          '--disable-dev-shm-usage'
        ] 
      };

      const browser = await puppeteer.launch(launchOptions);
      const page = await browser.newPage();

      // set viewport and user agent (just in case for nice viewing)
      await page.setViewport({width: 1366, height: 768});
      await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36');

      await page.goto(sourceUrl);

      await page.waitForSelector('div#contents ytd-rich-metadata-renderer:nth-child(1) #title', { timeout: 60000 });

      gameName = await page.evaluate(() => {
        return document.querySelector('div#contents ytd-rich-metadata-renderer:nth-child(1) #title').innerText.trim();
      });

      console.log("gameName:", gameName)

      var gameObj = { "gameName": gameName }

      this.setDataInRedis(sourceUrl + "/game", gameObj, INGEST_GAME_NAME_EXPIRATION, "Could not save game name to redis");

      // close the browser
      await browser.close();

      return gameObj
  })();

}

  setDataInRedis(key, data, expiration, errMsg) {
    return this.redisClient.set(key, JSON.stringify(data), 'EX', expiration,
      function(err) {
        if (err) {
          console.error(errMsg ? errMsg : '', err);
        }

        return data;
      }
    );
  }
}

function convertVideoDataModel(video, type) {
  const snippet = video.snippet;

  return {
    id: video.id.videoId,
    title: snippet.title,
    description: snippet.description,
    thumbnailUrl: snippet.thumbnails.default.url,
    publishedDate: snippet.publishedAt,
    providerType: ProvidersEnum.youtube,
    videoUrl: `https://youtube.com/watch?v=${video.id.videoId}`,
    type: type
  };
}

function buildGetVideosQueryParameters(channelId, pagingSorting={}) {
  const {limit = DEFAULT_LIMIT, nextCursor} = pagingSorting;
  const parameters = {
    type: 'video',
    part: 'snippet',
    maxResults: limit,
    channelId: channelId,
    order: 'date',
    key: API_KEY
  };

  if (nextCursor) {
    parameters.pageToken = nextCursor;
  }

  return qs.stringify(parameters);
}

const instance = new YoutubeService();
module.exports = instance;
