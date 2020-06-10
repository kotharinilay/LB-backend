const express = require('express');
const router = express.Router({mergeParams: true});

const AsyncMiddleware = require('../common/middlewares/AsyncMiddleware');
const RequestTimer = require('../common/middlewares/RequestTimer');
const SuccessResponse = require('../common/SuccessResponse');
const UserCommunityInvite = require('../models/userCommunityInvite');

router.get(
  '/invites/:id',
  RequestTimer('/api/v1/communities/invites/:id'),
  AsyncMiddleware(async (req, res) => {
    const token = req.params.id;
    const invite = await UserCommunityInvite.getByToken(token);

    const responseBody = new SuccessResponse({
      communityId: invite.community_id
    }).build();
    res.json(responseBody);
  })
);

module.exports = router;
