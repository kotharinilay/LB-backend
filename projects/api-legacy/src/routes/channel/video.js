const express = require('express');
const router = express.Router({mergeParams: true});

const AsyncMiddleware = require('../../common/middlewares/AsyncMiddleware');
const RequestTimer = require('../../common/middlewares/RequestTimer');
const SuccessResponse = require('../../common/SuccessResponse');
const ProvidersEnum = require('../../common/enums/ProvidersEnum');
const NotFoundError = require('../../errors/NotFoundError');
const UserChannel = require('../../models/userChannel');
const YoutubeService = require('../../services/social/YoutubeService');
const TwitchService = require('../../services/social/TwitchService');

router.get(
  '/:channelId/videos',
  RequestTimer('/api/v1/profiles/channels/:channelId/videos'),
  AsyncMiddleware(async (req, res) => {
    const userId = req.userId;
    const pagingSorting = buildPagingSorting(req.query);
    const channelId = req.params.channelId;
    const channel = await getChannel(channelId, userId);
    const videosPaginated = await getVideos(channel, pagingSorting);
    const pagination = videosPaginated.pagination || {};

    const responseBody = new SuccessResponse({
      data: videosPaginated.data
    })
      .nextCursor(pagination.nextCursor)
      .build();
    res.json(responseBody);
  })
);

router.get(
  '/:channelId/videos/live',
  RequestTimer('/api/v1/profiles/channels/:channelId/videos/live'),
  AsyncMiddleware(async (req, res) => {
    const userId = req.userId;
    const channelId = req.params.channelId;
    const channel = await getChannel(channelId, userId);
    const videos = await getLiveVideos(channel);

    const responseBody = new SuccessResponse({
      data: videos
    }).build();
    res.json(responseBody);
  })
);

router.get(
  '/videos/live',
  RequestTimer(),
  AsyncMiddleware(async (req, res) => {
    const userId = req.userId;
    const channels = await UserChannel.getByUserId(userId);

    const promises = channels.map((channel) => {
      return getLiveVideos(channel);
    });
    let videos = await Promise.all(promises);
    videos = videos.reduce((acc, val) => acc.concat(val), []);

    const responseBody = new SuccessResponse({
      data: videos
    }).build();
    res.json(responseBody);
  })
);

async function getVideos(channel, pagingSorting) {
  let videosPaginated;
  if (channel.provider_type === ProvidersEnum.youtube) {
    videosPaginated = await YoutubeService.getVideos(channel.external_id, pagingSorting);
  } else if (channel.provider_type === ProvidersEnum.twitch) {
    videosPaginated = await TwitchService.getVideos(channel.external_id, pagingSorting);
  } else {
    console.warn("Not supported provider type:", channel.provider_type);
  }

  return videosPaginated;
}

async function getLiveVideos(channel) {
  let videos = [];
  if (channel.provider_type === ProvidersEnum.youtube) {
    videos = await YoutubeService.getLiveStreams(channel.external_id);
  } else if (channel.provider_type === ProvidersEnum.twitch) {
    videos = await TwitchService.getLiveStreams(channel.external_id);
  } else {
    console.warn("Not supported provider type:", channel.provider_type);
  }

  videos.forEach((video) => completeLiveVideoDataModel(video, channel));

  return videos;
}

function completeLiveVideoDataModel(video, channel) {
  video.channel = {
    id: channel.external_id,
    name: channel.name,
    originalName: channel.original_name,
    providerType: channel.provider_type
  };
}

function buildPagingSorting(query) {
  return {
    limit: query.limit,
    nextCursor: query.nextCursor
  };
}

async function getChannel(id, userId) {
  const channel = await UserChannel.getByIdAndUserId(id, userId);

  if (!channel) {
    console.error(`Cannot find channel by Id ${id} for user ${userId}`);
    throw new NotFoundError('Cannot find channel');
  }

  return channel;
}

module.exports = router;
