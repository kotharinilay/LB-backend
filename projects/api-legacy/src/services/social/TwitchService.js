const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

const system = require("system-commands");
const util = require("util");
const AWS = require("aws-sdk");
const https = require("https");
/* global -Promise */
const Promise = require("bluebird");

const ProvidersEnum = require("../../common/enums/ProvidersEnum");
const ProviderVideoTypeEnum = require("../../common/enums/ProviderVideoTypeEnum");
const getRedisClient = require("../redis/redisClient");

const BadGatewayError = require('../../errors/BadGatewayError');

const CLIENT_ID = process.env.TWITCH_OAUTH_CLIENT_ID;
const API_BASE_URL = process.env.TWITCH_API_BASE_URL;
const TWITCH_OAUTH_TOKEN_URL = process.env.TWITCH_OAUTH_TOKEN_URL;
const TWITCH_NEW_OAUTH_CLIENT_ID = process.env.TWITCH_NEW_OAUTH_CLIENT_ID;
const TWITCH_NEW_OAUTH_CLIENT_SECRET = process.env.TWITCH_NEW_OAUTH_CLIENT_SECRET;
const TWITCH_VOD_CACHE_TIME_SECONDS = parseInt(
  process.env.TWITCH_VOD_CACHE_TIME_SECONDS,
  10
);
const TWITCH_LIVE_CACHE_TIME_SECONDS = parseInt(
  process.env.TWITCH_LIVE_CACHE_TIME_SECONDS,
  10
);
const THUMBNAIL_WIDTH_PLACEHOLDER_1 = "%{width}";
const THUMBNAIL_HEIGHT_PLACEHOLDER_1 = "%{height}";
const THUMBNAIL_WIDTH_PLACEHOLDER_2 = "{width}";
const THUMBNAIL_HEIGHT_PLACEHOLDER_2 = "{height}";
const THUMBNAIL_WIDTH = 320;
const THUMBNAIL_HEIGHT = 180;
const DEFAULT_LIMIT = 10;

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_CREDENTIALS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_CREDENTIALS_SECRET_KEY,
  region: process.env.AWS_S3_REGION,
});

const FORTNITE_GAME_ID = 33214;
const VALORANT_GAME_ID = 516575;
const WARZONE_GAME_ID = 25416;
const COD_MW_GAME_ID = 512710;

const INGEST_GAME_NAME_EXPIRATION = 86400; // 24 hrs in seconds

class TwitchService {
  constructor() {
    this.redisClient = getRedisClient();
  }

  async getChatFileFromS3(twitchVideoId) {
    var fileUrl =
      "https://cloudmedia.wizardlabs.gg/chat/twitch/" + twitchVideoId + ".txt";

    return new Promise((resolve, reject) => {
      https
        .get(fileUrl, (res) => {
          if (res.statusCode == 200) {
            console.log("Found " + fileUrl + " on S3.");
            resolve(fileUrl);
          } else {
            reject(false);
          }
        })
        .on("error", (e) => {
          return false;
        });
    }).catch((err) => {
      console.error("Error Occured", err);
    });
  }

  async downloadChatHistory(twitchVideoId) {
    return new Promise(function (resolve, reject) {
      var fileUrl =
        "https://cloudmedia.wizardlabs.gg/chat/twitch/" +
        twitchVideoId +
        ".txt";

      // file doesn't exist on S3, download from Twitch
      var command =
        "twitch-chatlog " + twitchVideoId + ' --client-id "' + CLIENT_ID + '"';

      console.log("File doesn't exist on S3, trying to download...");

      system(command).then((output) => {
        if (output.length > 0) {
          // Upload the logs to S3
          console.log(
            "Downloaded chat logs for " + twitchVideoId + " from Twitch"
          );

          var s3Params = {};
          s3Params["Body"] = output;
          s3Params["ContentType"] = "text/plain";
          (s3Params["Bucket"] = process.env.AWS_S3_AUTO_CLIP_BUCKET_NAME),
            (s3Params["Key"] = "media/chat/twitch/" + twitchVideoId + ".txt");

          s3.putObject(s3Params, function (err, data) {
            if (err) {
              console.log(err, err.stack);
              reject(err);
            } else {
              if ("ETag" in data) {
                resolve(fileUrl);
              } else {
                console.log("Error uploading file to S3");
                reject(false);
              }
            }
          });
        } else {
          reject(false);
        }
      });
    }).catch((err) => {
      reject(err);
      console.error("Error Occured", err);
    });
  }

  async getVideos(userId, pagingSorting = { limit: DEFAULT_LIMIT }) {
    const url = buildGetVideosUrl(userId, pagingSorting);

    return new Promise((resolve, reject) => {
      this.redisClient.get(url, function (err, response) {
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
          "Error occured attempting to access redis data during TwitchService.getVideos",
          err
        );

        return this._getVideos(url);
      });
  }

  async _getVideos(url) {

    let token = await this._getToken();
    
    const config = {
      headers: {
        "Client-ID": TWITCH_NEW_OAUTH_CLIENT_ID,
        'Authorization': 'Bearer ' + token
      },
    };

    return axios
      .get(url, config)
      .then((response) => {
        const videoItems = response.data.data;
        const nextCursor = response.data.pagination
          ? response.data.pagination.cursor
          : undefined;

        const videos = videoItems.map((video) => convertVideoDataModel(video));
        const returnData = {
          data: videos,
          pagination: {
            nextCursor: nextCursor,
          },
        };

        this.setDataInRedis(url, returnData, TWITCH_VOD_CACHE_TIME_SECONDS);

        // Temp Debug to catch a caching bug
        console.log([url, returnData, TWITCH_VOD_CACHE_TIME_SECONDS]);

        return returnData;
      })
      .catch((error) => {
        console.error(
          "Error occurred while perform video listing from Twitch",
          error
        );
        return {
          data: [],
          pagination: {},
        };
      });
  }

  async getLiveStreams(userId) {
    const url = buildGetLiveStreamsUrl(userId, FORTNITE_GAME_ID);

    return new Promise((resolve, reject) => {
      this.redisClient.get(url, function (err, response) {
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
          "Error occured attempting to access redis data during TwitchService.getLiveStreams",
          err
        );

        return this._getLiveStreams(url);
      });
  }

  async _getLiveStreams(url) {

    let token = await this._getToken();
    
    const config = {
      headers: {
        "Client-ID": TWITCH_NEW_OAUTH_CLIENT_ID,
        'Authorization': 'Bearer ' + token
      },
    };

    return axios
      .get(url, config)
      .then((response) => {
        const videos = response.data.data;
        const returnData = videos.map((video) => {
          return convertLiveStreamDataModel(video);
        });

        this.setDataInRedis(url, returnData, TWITCH_LIVE_CACHE_TIME_SECONDS);

        return returnData;
      })
      .catch((error) => {
        console.error(
          "Error occurred while perform LIVE video listing from Twitch",
          error
        );
        return [];
      });
  }

  async getVideoDetails(videoId) {

    let token = await this._getToken();
    
    const config = {
      headers: {
        "Client-ID": TWITCH_NEW_OAUTH_CLIENT_ID,
        'Authorization': 'Bearer ' + token
      },
    };

    return axios
      .get("https://api.twitch.tv/kraken/videos/" + videoId, config)
      .then((response) => {

        console.log("Twitch Response")
        console.log(response)

        const videos = response.data.data;
        const returnData = videos.map((video) => {
          return convertLiveStreamDataModel(video);
        });

        this.setDataInRedis(url, returnData, TWITCH_LIVE_CACHE_TIME_SECONDS);

        return returnData;
      })
      .catch((error) => {
        console.error(
          "Error occurred while perform LIVE video listing from Twitch",
          error
        );
        return [];
      });
  }

  async getLiveStreamDetailsByUserName(userName) {

    let token = await this._getToken();
    
    const config = {
      headers: {
        "Client-ID": TWITCH_NEW_OAUTH_CLIENT_ID,
        'Authorization': 'Bearer ' + token
      },
    };

    return axios
      .get("https://api.twitch.tv/helix/streams?user_login=" + userName, config)
      .then((response) => {

        // console.log("Twitch Response")
        // console.log(response)

        return response.data.data;

        // this.setDataInRedis(url, returnData, TWITCH_LIVE_CACHE_TIME_SECONDS);

        // return returnData;
      })
      .catch((error) => {
        console.error(
          "Error occurred while grabbing live stream details by twitch username",
          error
        );
        return [];
      });
  }

  async _getToken(){

    const requestData = {
      url: `${TWITCH_OAUTH_TOKEN_URL}?grant_type=client_credentials&client_id=${TWITCH_NEW_OAUTH_CLIENT_ID}&client_secret=${TWITCH_NEW_OAUTH_CLIENT_SECRET}`,
      method: "POST",
    };

    let token;

    await axios
      .post(requestData.url)
      .then((response) => {
        token = response.data.access_token;
      })
      .catch((error) => {
        console.error("Cannot get request token from Twitch:", error);
        throw new BadGatewayError("Not a valid user.");
      });

    return token;

  }

async mixerGetGameName(sourceUrl) {
  try {

    const browser = await puppeteer.launch({
      executablePath: '/usr/bin/chromium-browser',
      args: ['--no-sandbox', '--headless', '--disable-gpu', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();
    await page.goto(sourceUrl);
    await page.waitForSelector('.tw-flex [data-a-target="video-info-game-boxart-link"]', { timeout: 1000 });

    const body = await page.evaluate(() => {
      return document.querySelector('.tw-flex [data-a-target="video-info-game-boxart-link"]').innerText.trim();
    });
    
    console.log(body);

    await browser.close();
  } catch (error) {
    console.log(error);
  }
}

async twitchGetGameName(sourceUrl) {

  var redisUrl = sourceUrl + "/game"

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

      return this._getTwitchGameName(sourceUrl)
      
    })
    .catch((err) => {
      
      console.error(
        "Error: Could not get game name from Twitch/Redis",
        err
      );

      return this._getTwitchGameName(sourceUrl)
      
    });
}

async _getTwitchGameName(sourceUrl) {

  var gameName = "";

  // if the URL is a live stream URL
  // use the API
  // otherwise scrape
  const regex = /videos/g;
  const found = sourceUrl.match(regex);

  // console.log("found", found)

  if (found !== null) {
    // it's a video url

    try {

      const browser = await puppeteer.launch({
        executablePath: '/usr/bin/chromium-browser',
        args: ['--no-sandbox', '--headless', '--disable-gpu', '--disable-dev-shm-usage']
      });

      const page = await browser.newPage();
      
      await page.goto(sourceUrl);
      await page.waitForSelector('.tw-flex [data-a-target="video-info-game-boxart-link"]', { timeout: 30000 });
      gameName = await page.evaluate(() => {
        return document.querySelector('.tw-flex [data-a-target="video-info-game-boxart-link"]').innerText.trim();
      });

      // console.log("gameName", gameName)

      if (!gameName) {
        // Probably showing an ad
        // let's try again
        await page.goto(sourceUrl);
        await page.waitForSelector('.tw-flex [data-a-target="video-info-game-boxart-link"]', { timeout: 30000 });
        gameName = await page.evaluate(() => {
          return document.querySelector('.tw-flex [data-a-target="video-info-game-boxart-link"]').innerText.trim();
        });
      }

      // live streams
      // await page.waitForSelector('.tw-inline-flex [data-a-target="stream-game-link"]', { timeout: 30000 });
      // gameName = await page.evaluate(() => {
      //   return document.querySelector('.tw-inline-flex [data-a-target="stream-game-link"]').innerText.trim();
      // });
      
      await browser.close();

      var gameObj = {"gameName":gameName}

      this.setDataInRedis(sourceUrl + "/game", gameObj, INGEST_GAME_NAME_EXPIRATION, "Could not save game name to redis");

      return gameObj

    } catch (error) {
      console.log(error);
    }

  } else {
    // it's a live stream url
    const regexUsername = /[a-zA-Z0-9]+$/g;
    const userNameFound = sourceUrl.match(regexUsername);

    if (userNameFound !== null) {
      var username = userNameFound[0]
      
      // console.log("username", username)

      var details = await this.getLiveStreamDetailsByUserName(username);

      // console.log("details", details)

      if (details && details[0] && details[0]["game_id"]) {

        var gameId = parseInt(details[0]["game_id"]);

        // console.log("gameId", gameId)

        var gameName = '';

        if (gameId == FORTNITE_GAME_ID) {
          gameName = 'Fortnite'
        } else if (gameId == VALORANT_GAME_ID) {
          gameName = 'Valorant'
        } else if (gameId == WARZONE_GAME_ID) {
          gameName = 'Warzone'
        } else if (gameId == COD_MW_GAME_ID) {
          gameName = 'Warzone'
        }

        var gameObj = {"gameName":gameName}
        
        this.setDataInRedis(sourceUrl + "/game", gameObj, INGEST_GAME_NAME_EXPIRATION, "Could not save game name to redis");

        // console.log("gameObj", gameObj)
        
        return gameObj

      }
    }
  }

}

  setDataInRedis(key, data, expiration, errMsg) {
    return this.redisClient.set(
      key,
      JSON.stringify(data),
      "EX",
      expiration,
      function (err) {
        if (err) {
          console.error(errMsg ? errMsg : "", err);
        }

        return data;
      }
    );
  }
}

function buildGetVideosUrl(userId, pagingSorting = {}) {
  const { limit, nextCursor } = pagingSorting;
  let url = `${API_BASE_URL}/helix/videos?user_id=${userId}&type=archive`;

  if (limit) {
    url += `&first=${limit}`;
  }

  if (nextCursor) {
    url += `&after=${nextCursor}`;
  }

  return url;
}

function buildGetLiveStreamsUrl(userId, gameId) {
  return `${API_BASE_URL}/helix/streams?user_id=${userId}`;
}

function convertVideoDataModel(video) {
  return {
    id: video.id,
    title: video.title,
    description: video.description,
    duration: convertDuration(video.duration),
    thumbnailUrl: replaceDimensionPlaceholders(video.thumbnail_url),
    publishedDate: video.published_at,
    providerType: ProvidersEnum.twitch,
    videoUrl: `https://twitch.tv/videos/${video.id}`,
    type: ProviderVideoTypeEnum.archive,
  };
}

function convertLiveStreamDataModel(video) {
  return {
    id: video.id,
    title: video.title,
    thumbnailUrl: replaceDimensionPlaceholders(video.thumbnail_url),
    publishedDate: video.started_at,
    viewerCount: video.viewer_count,
    providerType: ProvidersEnum.twitch,
    videoUrl: `https://twitch.tv/${video.user_name}`,
    type: ProviderVideoTypeEnum.live,
  };
}

function replaceDimensionPlaceholders(url) {
  if (!url) {
    return url;
  }

  if (url.includes(THUMBNAIL_WIDTH_PLACEHOLDER_1)) {
    return url
      .replace(THUMBNAIL_HEIGHT_PLACEHOLDER_1, THUMBNAIL_HEIGHT)
      .replace(THUMBNAIL_WIDTH_PLACEHOLDER_1, THUMBNAIL_WIDTH);
  } else if (url.includes(THUMBNAIL_WIDTH_PLACEHOLDER_2)) {
    return url
      .replace(THUMBNAIL_HEIGHT_PLACEHOLDER_2, THUMBNAIL_HEIGHT)
      .replace(THUMBNAIL_WIDTH_PLACEHOLDER_2, THUMBNAIL_WIDTH);
  }

  return url;
}

function convertDuration(duration) {
  return duration
    .substring(0, duration.length - 1)
    .replace("h", ":")
    .replace("m", ":");
}

function getStatusCodeResult(website) {
  return new Promise((resolve, reject) => {
    https.get(website, (res) => {
      let statusCode = res.statusCode,
        error =
          statusCode >= 400 && statusCode <= 500 ? `error: ${website}` : null;
      if (error) {
        reject(error);
        return false;
      } else if (statusCode >= 200 && statusCode <= 300) {
        return true;
      }
    });
  });
}

const instance = new TwitchService();
module.exports = instance;
