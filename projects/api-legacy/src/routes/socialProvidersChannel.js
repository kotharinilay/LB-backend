const express = require('express');
const router = express.Router();

const dlv = require('dlv');
const validator = require('validator');

const SuccessResponse = require('../common/SuccessResponse');
const ProvidersEnum = require('../common/enums/ProvidersEnum');
const {authFilter} = require('../common/middlewares/AuthFilter');
const AsyncMiddleware = require('../common/middlewares/AsyncMiddleware');
const redisCache = require('../common/middlewares/RedisCacheMiddleware');
const BadRequestError = require('../errors/BadRequestError');
const YoutubeService = require('../services/social/YoutubeService');
const TwitchService = require('../services/social/TwitchService');
const TwitchSearchService = require('../services/social/search/TwitchSearchService');
const YoutubeSearchService = require('../services/social/search/YoutubeSearchService');
const MixerService = require('../services/social/MixerService');
const MixerSearchService = require('../services/social/search/MixerSearchService');
const RequestTimer = require('../common/middlewares/RequestTimer')

const CACHE_EXPIRATION_TIME = 18000;

const tmi = require('tmi.js');

const cache = redisCache({
  expirationTime: CACHE_EXPIRATION_TIME
});
router.use(authFilter);

router.get('/channels/twitch/chat/live/:twitchUserName', (req, res) => {

  const twitchUserName = req.params.twitchUserName;

  const client = new tmi.Client({
    options: { debug: false },
    connection: {
      reconnect: true,
      secure: true
    },
    identity: {
      username: 'WizardLabsInc',
      password: 'oauth:fjpi8lwdr7ficfogkoj8o5cc781jih'
    },
    channels: [ twitchUserName ]
  });

  client.connect();

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Transfer-Encoding', 'chunked');

  client.on("chat", (channel, userstate, message, self) => {
      // Don't listen to my own messages..
      if (self) return;

      // console.log(userstate)
      
      if (userstate["message-type"] == "chat") {
        var username = userstate["username"];
        var postTime = new Date(parseInt(userstate["tmi-sent-ts"]));
        var chatTime = postTime.toLocaleTimeString('en-US', { hour12: false });
        res.write("["+chatTime+"] "+username+": " + message + "<br>\n");
      }
  });

  client.on("disconnected", (reason) => {
    res.end();
  });

});

router.get(
  '/channels/twitch/chat/:twitchVideoId',
  RequestTimer(),
  AsyncMiddleware(async (req, res) => {
    
    const twitchVideoId = req.params.twitchVideoId;

    console.log("twitchVideoId: " + twitchVideoId)

    if (!twitchVideoId) {
      console.error('Twitch Video ID is required');
      throw new BadRequestError('Twitch Video ID is required');
    }

    const chatFileFromS3 = await TwitchService.getChatFileFromS3(twitchVideoId);

    var chats = "";
    if (!chatFileFromS3) {
      chats = await TwitchService.downloadChatHistory(twitchVideoId);
    } else {
      chats = chatFileFromS3
    }

    const responseBody = new SuccessResponse({
      file: chats
    }).build();
    res.send(responseBody);
  })
);

router.get('/channels/search', cache, AsyncMiddleware(async (req, res) => {
  const name = dlv(req, 'query.name');
  let channels = [];
  if (name === undefined || name.trim().length === 0) {
    console.warn('Name parameter is empty:', name);
  } else {
    channels = await searchChannels(name.trim());
  }

  const responseBody = new SuccessResponse({
    data: channels
  }).build();
	res.send(responseBody);
}));

router.get(
  '/channels/videos',
  RequestTimer(),
  AsyncMiddleware(async (req, res) => {
    const source = req.query.source;
    validateGetChannelVideosRequest(source);
    let videos = [];

    const providerType = getProviderType(source);
    if (providerType) {
      const channelName = await parseChannelName(source);
      const channelData = await getChannelData(channelName, providerType);
      if (channelData) {
        const channelId = channelData.id;
        if (providerType == ProvidersEnum.mixer) {
          videos = await getChannelVideos(channelName, providerType);
        } else {
          videos = await getChannelVideos(channelId, providerType);
        }
      }
    }

    const responseBody = new SuccessResponse({
      data: videos
    }).build();
    res.send(responseBody);
  })
);

router.get('/accounts/search', cache, AsyncMiddleware(async (req, res) => {
  const name = dlv(req, 'query.name');
  let accounts = [];
  if (name === undefined || name.trim().length === 0) {
    console.warn('Name parameter is empty:', name);
  } else {
    accounts = await searchAccounts(name.trim());
  }

  const responseBody = new SuccessResponse({
    data: accounts
  }).build();
  res.send(responseBody);
}));

async function searchChannels(channelName) {
  const promises = [];
  // Check if the user is searching against a specific provider
  // first, and only show results for that.
  if (channelName.match(/^twitch\.tv\//i)) {
    channelName = channelName.toLowerCase().split('twitch.tv/')[1];
    promises.push(TwitchSearchService.searchChannel(channelName));
  }
  else if (channelName.match(/^youtube\.com\//i)) {
    channelName = channelName.toLowerCase().split('youtube.com/')[1];
    promises.push(YoutubeSearchService.searchChannel(channelName));
  }
  else {
    promises.push(YoutubeSearchService.searchChannel(channelName));
    promises.push(TwitchSearchService.searchChannel(channelName));
  }

  const channelsArrays = await Promise.all(promises);
  let channels = [];

  channelsArrays.forEach((arr) => {
    channels = channels.concat(arr);
  });

  return channels;
}

async function searchAccounts(channelName) {
  const promises = [];
  promises.push(TwitchSearchService.searchChannel(channelName));
  promises.push(MixerSearchService.searchChannel(channelName));
  promises.push(YoutubeSearchService.searchChannel(channelName));

  const channelsArrays = await Promise.all(promises);
  let channels = [];

  channelsArrays.forEach((arr) => {
    channels = channels.concat(arr);
  });

  return channels;
}

function validateGetChannelVideosRequest(source) {
  if (!source || !validator.isURL(source)) {
    console.error('Source parameter is incorrect:', source);
    throw new BadRequestError('Input parameters empty or invalid');
  }
}

function getProviderType(url) {
  if (url.includes('twitch.')) {
    return ProvidersEnum.twitch;
  } else if (url.includes('youtube.com')) {
    return ProvidersEnum.youtube;
  } else if (url.includes('mixer.com')) {
    return ProvidersEnum.mixer;
  } else {
    console.warn('Cannot determine provider by URL:', url);
  }
}

async function parseChannelName(url) {
  const pathArray = url.split('/');
  if(pathArray[pathArray.length - 2] === "videos"){

    return await TwitchSearchService.getVideoDetails(pathArray[pathArray.length - 1])

  }else{


    return pathArray[pathArray.length - 1]

  }
}

async function getChannelData(channelName, providerType) {
  let channels;
  if (providerType === ProvidersEnum.twitch) {
    channels = await TwitchSearchService.searchChannel(channelName);
  } else if (providerType === ProvidersEnum.youtube) {
    channels = await YoutubeSearchService.searchChannel(channelName);
  } else if (providerType === ProvidersEnum.mixer) {
    channels = await MixerSearchService.searchChannel(channelName);
  }

  if (!channels || channels.length === 0) {
    console.info('Channels not found:', channelName, providerType);
    return;
  }

  return channels[0];
}

async function getChannelVideos(channelId, providerType) {

  const paging = {
    limit: 20
  };
  const promises = [];
  if (providerType === ProvidersEnum.twitch) {
    promises.push(TwitchService.getLiveStreams(channelId));
    promises.push(TwitchService.getVideos(channelId, paging));
  } else if (providerType === ProvidersEnum.youtube) {
    promises.push(YoutubeService.getLiveStreams(channelId));
    promises.push(YoutubeService.getVideos(channelId, paging));
  } else if (providerType === ProvidersEnum.mixer) {
    // promises.push(MixerService.getLiveStreams(channelId));
    promises.push(MixerService.getVideos(channelId, paging));
  }

  const videos = await Promise.all(promises);
  return videos.map((video) => {
    if (Array.isArray(video)) {
      return video;
    } else if (video.data) {
      return video.data;
    }

    return video;
  })
    .reduce((acc, val) => acc.concat(val), []);
}

module.exports = router;
