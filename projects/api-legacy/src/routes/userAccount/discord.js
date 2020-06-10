const express = require('express');
const router = express.Router({mergeParams: true});

const {authFilter} = require('../../common/middlewares/AuthFilter');
const AsyncMiddleware = require('../../common/middlewares/AsyncMiddleware');
const SuccessResponse = require('../../common/SuccessResponse');
const ProvidersEnum = require('../../common/enums/ProvidersEnum');
const DiscordService = require('../../services/social/DiscordService');
const UserAccountService = require('../../services/UserAccountService');

router.get('/servers', authFilter, AsyncMiddleware(async (req, res) => {
  const userId = req.userId;
  const servers = await DiscordService.getServers(userId);

  const responseBody = new SuccessResponse({
    data: servers
  })
    .build();
  res.json(responseBody);
}));

router.get('/servers/:id/bots', authFilter, AsyncMiddleware(async (req, res) => {
  const userId = req.userId;
  const serverId = req.params.id;
  const url = await DiscordService.getBotAuthUrl(serverId);

  await UserAccountService.getUserAccount(userId, ProvidersEnum.discord);

  const responseBody = new SuccessResponse({
    url: url
  })
    .build();
  res.json(responseBody);
}));

router.get('/servers/:id/channels', authFilter, AsyncMiddleware(async (req, res) => {
  const userId = req.userId;
  const serverId = req.params.id;
  const channels = await DiscordService.getChannels(serverId, userId);

  const responseBody = new SuccessResponse({
    data: channels
  })
    .build();
  res.json(responseBody);
}));

module.exports = router;
