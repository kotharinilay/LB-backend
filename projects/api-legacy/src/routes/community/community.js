const express = require('express');
const router = express.Router({mergeParams: true});

const AsyncMiddleware = require('../../common/middlewares/AsyncMiddleware');
const RequestTimer = require('../../common/middlewares/RequestTimer');
const {validateFieldsParameter} = require('../../common/middlewares/FieldsQueryParameterValidator');
const NotFoundError = require('../../errors/NotFoundError');
const UserCommunityService = require('../../services/UserCommunityService');
const UserCommunityInvite = require('../../models/userCommunityInvite');
const SuccessResponse = require('../../common/SuccessResponse');
const {buildPagingSorting} = require('../../common/PagingSorting');

// Get information on each community a user belongs to if 'fields' isn't passed.
// Get all videos from all communities a user belongs to if 'fields=videos'
router.get(
  '/',
  validateFieldsParameter,
  RequestTimer(),
  AsyncMiddleware(async (req, res) => {
    const userId = req.userId;
    const fields = req.query.fields;
    const pagingSorting = buildPagingSorting(req.query);

    const {data, pagination} = await UserCommunityService.getUserCommunities(
      userId,
      fields,
      pagingSorting
    );

    const responseBody = new SuccessResponse({
      pagination,
      data
    }).build();
    res.json(responseBody);
  })
);

router.get(
  '/social/emojis',
  RequestTimer('/api/v1/social/emojis'),
  AsyncMiddleware(async (req, res) => {
    
    const emojis = await UserCommunityService.getEmojis();

    const responseBody = new SuccessResponse(emojis).build();
    
    res.json(responseBody);
  })
);

// Gets a list of streamers that belong to a particular community
router.get(
  '/:id/streamers',
  RequestTimer('/api/v1/profiles/communities/:id/streamers'),
  AsyncMiddleware(async (req, res) => {
    const userId = req.userId;
    const communityId = req.params.id;
    const community = await UserCommunityService.getStreamers(userId,communityId);

    const responseBody = new SuccessResponse(community).build();
    res.json(responseBody);
  })
);

// Get information on a specific community a user belongs to
router.get(
  '/:id',
  RequestTimer('/api/v1/profiles/communities/:id'),
  AsyncMiddleware(async (req, res) => {
    const userId = req.userId;
    const communityId = req.params.id;
    const community = await UserCommunityService.getUserCommunity(userId,
      communityId);

    const responseBody = new SuccessResponse(community).build();
    res.json(responseBody);
  })
);

// Creates an invite from a community member to a specific community
router.get(
  '/:id/invites',
  RequestTimer('/api/v1/profiles/communities/:id/invite'),
  AsyncMiddleware(async (req, res) => {
    const userId = req.userId;
    const communityId = req.params.id;

    await validateOnCreateInvite(userId, communityId);

    let token;
    let invite = await UserCommunityInvite.getByCommunityId(communityId);
    if (invite) {
      token = invite.token;
    } else {
      token = generateToken();
      invite = {
        community_id: communityId,
        token: token
      };
      await UserCommunityInvite.create(invite);
    }

    const responseBody = new SuccessResponse({
      token: token
    }).build();
    res.json(responseBody);
  })
);

/**
 * Contains logic to check preconditions on create invite to community
 * @param userId - User Id that create invite
 * @param communityId - Community Id
 * @returns {Promise<void>} Promise
 * @throws {NotFoundError}
 */
async function validateOnCreateInvite(userId, communityId) {
  const isMember = await UserCommunityService.checkUserCommunityMembership(
    userId, communityId
  );
  if (isMember) {
    console.error(
      'User cannot create invite to community, because he is not a member:',
      userId, communityId
    );
    throw new NotFoundError('Cannot find community');
  }
}

/**
 * Generates string token
 * @returns {string} Token
 */
function generateToken() {
  return Math.random().toString(36).substring(2, 15);
}

module.exports = router;
