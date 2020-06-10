const express = require('express');
const router = express.Router({mergeParams: true});
const dlv = require('dlv');

const moment = require('moment');

const AsyncMiddleware = require('../../common/middlewares/AsyncMiddleware');
const RequestTimer = require('../../common/middlewares/RequestTimer');
const UserCommunityService = require('../../services/UserCommunityService');
const UserVideoService = require('../../services/UserVideoService');
const UserCommunityVideo = require('../../models/userCommunityVideo');
const UserCommunityMember = require('../../models/userCommunityMember');
const SuccessResponse = require('../../common/SuccessResponse');
const {buildPagingSorting} = require('../../common/PagingSorting');

// Get all of a user's videos that belong to any communities
// they are a part of
router.get(
  '/videos',
  RequestTimer(),
  AsyncMiddleware(async (req, res) => {
    const userId = req.userId;
    const pagingSorting = buildPagingSorting(req.query);

    const {data: videos, pagination} = await UserCommunityVideo.getAllVideosByUserId(
      userId,
      pagingSorting
    );

    const responseData = videos.map((video) => buildVideoResponseModel(video));

    const responseBody = new SuccessResponse({
      pagination,
      data: responseData
    }).build();
    res.json(responseBody);
  })
);

// Get all of a user's videos that belong to a specific community {id}
// if they are a member
router.get(
  '/:id/videos',
  RequestTimer('/api/v1/profiles/communities/:id/videos'),
  AsyncMiddleware(async (req, res, next) => {
    const userId = req.userId;
    const {id: communityId} = req.params;

    const userIsMember = await UserCommunityService.checkUserCommunityMembership(
      userId,
      communityId
    );

    if (!userIsMember) {
      console.error(
        'Cannot get videos because user is not a member of community',
        userId, communityId
      );
      return next(
        new BadRequestError('User is not a member of this community')
      );
    }

    const pagingSorting = buildPagingSorting(req.query);

    const {
      data: communityVideos,
      pagination
    } = await UserCommunityVideo.getAllVideosByCommunityId(
      communityId,
      pagingSorting
    );

    const responseData = communityVideos.map((video) =>
      buildVideoResponseModel(video)
    );

    const responseBody = new SuccessResponse({
      pagination,
      data: responseData
    }).build();
    res.json(responseBody);
  })
);

// Associate a user's video with a community
router.post(
  '/:id/videos',
  RequestTimer('/api/v1/profiles/communities/:id/videos'),
  AsyncMiddleware(async (req, res, next) => {
    const userId = req.userId;
    const {id: communityId} = req.params;
    const videoId = dlv(req, 'body.videoId');

    validateAddRequest(req.body);

    const userIsMember = await UserCommunityMember.existsByUserIdAndCommunityId(
      userId,
      communityId
    );

    if (!userIsMember) {
      console.error(
        'Cannot add video to community, because user is not a member:',
        userId, communityId
      );
      return next(
        new BadRequestError('User is not a member of this community')
      );
    }

    await UserVideoService.getVideo(videoId, userId);

    const video = {
      user_id: userId,
      community_id: communityId,
      video_id: videoId
    };
    const responseId = await UserCommunityVideo.create(video);

    const responseBody = new SuccessResponse({
      id: responseId
    }).build();
    res.json(responseBody);
  })
);

function validateAddRequest(requestBody) {
  const videoId = requestBody.videoId;
  if (!videoId || isNaN(videoId)) {
    console.error(
      'Cannot add video to community, because request is invalid:', requestBody
    );
    throw new BadRequestError('Input parameter is not complete or invalid');
  }
}

function buildVideoResponseModel(video) {
  const result = {
    id: video.id,
    name: video.name,
    url: video.url,
    thumbnailUrl: video.thumbnail_url,
    createdDate: moment.utc(video.created_date).format(),
    streamerName: video.streamer_name,
    streamDate: video.stream_date,
    gameMode: video.game_mode,
    streamId: video.stream_id
  };

  if (video.user_id) {
    result.owner = {
      id: video.user_id,
      name: video.user_name
    }
  }

  return result;
}

module.exports = router;
