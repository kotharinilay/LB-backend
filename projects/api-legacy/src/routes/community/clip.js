const express = require('express');
const router = express.Router({mergeParams: true});

const moment = require('moment');

const AsyncMiddleware = require('../../common/middlewares/AsyncMiddleware');
const RequestTimer = require('../../common/middlewares/RequestTimer');
const SuccessResponse = require('../../common/SuccessResponse');
const NotFoundError = require('../../errors/NotFoundError');
const UserClip = require('../../models/userClip');
const UserCommunity = require('../../models/userCommunity');
const UserClipService = require('../../services/UserClipService');
const {buildPagingSorting} = require('../../common/PagingSorting');

router.get(
  '/clips',
  RequestTimer('/api/v1/profiles/communities/clips'),
  AsyncMiddleware(async (req, res) => {
    const userId = req.userId;
    const pagingSorting = buildPagingSorting(req.query);
    const tag = req.query.tag;
    const name = req.query.name;
    const fromTime = req.query.from;
    const toTime = req.query.to;
    const killCount = req.query.killCount;
    const killDistance = req.query.killDistance;
    const weaponType = req.query.weaponType;
    const streamer = req.query.streamer;
    const gameMode = req.query.gameMode;
    const game = req.query.game;

    const {
      data: clips,
      pagination
    } = await UserClip.getForUsersFromSameCommunitiesByUserId(
      userId,
      tag,
      name,
      killCount,
      killDistance,
      weaponType,
      streamer,
      gameMode,
      fromTime,
      toTime,
      game,
      pagingSorting
    );
    const responseData = clips.map((clip) => buildClipResponseModel(clip));

    const responseBody = new SuccessResponse({
      pagination,
      data: responseData
    }).build();
    res.json(responseBody);
  })
);

router.get(
  '/clips/tags',
  RequestTimer(),
  AsyncMiddleware(async (req, res) => {
    const pagingSorting = buildPagingSorting(req.query);
    // Return top tags if query is not specified
    UserClip.getTopTags(null, pagingSorting).then(        
      (topTagsPaginated) => {
        const responseBody = new SuccessResponse({
          data: topTagsPaginated.data, pagination: topTagsPaginated.pagination
        }).build();
        res.json(responseBody);
      }
    );
  })
);

router.get(
  '/clips/games',
  RequestTimer(),
  AsyncMiddleware(async (req, res) => {
    const pagingSorting = buildPagingSorting(req.query);
    
    let topTagsPaginated = await UserClip.getTopGames(null, pagingSorting);

    const responseBody = new SuccessResponse({
      data: topTagsPaginated.data, pagination: topTagsPaginated.pagination
    }).build();

    res.json(responseBody);

  })
);


router.get(
  '/clips/:id',
  RequestTimer('/api/v1/profiles/communities/clips/:id'),
  AsyncMiddleware(async (req, res) => {
    const userId = req.userId;
    const clipId = req.params.id;
    const clip = await UserClipService.getClipById(clipId);
    const commonCommunitiesCountData =
      await UserCommunity.getCountOfCommonCommunities(
        userId, clip.user_id
      );

    if (commonCommunitiesCountData.count === 0) {
      console.error(`User '${userId}' cannot get another's clip '${clipId}',` +
        ` because he is not have common communities with clip owner`);
      throw new NotFoundError('Clip not found');
    }

    const responseData = buildClipResponseModel(clip);
    const responseBody = new SuccessResponse(responseData).build();
    res.json(responseBody);
  })
);

function buildClipResponseModel(clip) {
  const returnClip = {
    id: clip.id,
    name: clip.name,
    type: clip.type,
    gameName: clip.game_name,
    tags: clip.tags,
    url: clip.url,
    thumbnailUrl: clip.thumbnail_url,
    createdDate: moment.utc(clip.created_date).format(),
    streamerName: clip.streamer_name,
    gameMode: clip.game_mode,
    streamDate: clip.stream_date
  };

  // if (clip.user_name) {
    returnClip.owner = {
      id: clip.user_id,
      user_name: clip.user_name || null,
      name: clip.user_full_name || null,
      email: clip.email || null,
      profile: clip.avatar? clip.avatar.url : null,
    };
  // }

  if (clip.kill_count) {
    returnClip.killCount = clip.kill_count
  }
  if (clip.kill_distance) {
    returnClip.killDistance = clip.kill_distance
  }
  if (clip.main_weapon) {
    returnClip.weaponType = clip.main_weapon
  }


  return returnClip;
}

module.exports = router;
