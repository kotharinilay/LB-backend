const express = require('express');
const router = express.Router({mergeParams: true});

const AsyncMiddleware = require('../../common/middlewares/AsyncMiddleware');
const RequestTimer = require('../../common/middlewares/RequestTimer');
const BadRequestError = require('../../errors/BadRequestError');
const NotFoundError = require('../../errors/NotFoundError');
const SuccessResponse = require('../../common/SuccessResponse');
const ProviderTypeValidator = require('../../common/validator/ProviderTypeValidator');
const UserChannel = require('../../models/userChannel');

router.get(
  '/',
  RequestTimer(),
  AsyncMiddleware(async (req, res) => {
    const userId = req.userId;
    const channels = await getChannels(userId);

    const responseBody = new SuccessResponse({
      data: channels
    }).build();
    res.json(responseBody);
  })
);

router.get(
  '/:id',
  RequestTimer('/api/v1/profiles/channels/:id'),
  AsyncMiddleware(async (req, res) => {
    const userId = req.userId;
    const channelId = req.params.id;
    const channel = await getChannel(channelId, userId);

    const responseBody = new SuccessResponse(channel).build();
    res.json(responseBody);
  })
);

router.post(
  '/',
  RequestTimer(),
  AsyncMiddleware(async (req, res) => {
    const userId = req.userId;
    const requestBody = req.body;
    validateCreateRequest(requestBody);

    await checkForChannelDuplicates(requestBody, userId);
    const channel = buildChannel(requestBody);
    channel.user_id = userId;
    const id = await UserChannel.create(channel);

    const responseBody = new SuccessResponse({
      id: id
    }).build();
    res.json(responseBody);
  })
);

router.put(
  '/:id',
  RequestTimer('/api/v1/profiles/channels/:id'),
  AsyncMiddleware(async (req, res) => {
    const userId = req.userId;
    const channelId = req.params.id;
    const requestBody = req.body;

    validateUpdateRequest(requestBody);
    await checkForChannelNameDuplicates(requestBody.name, userId);
    const channel = await getChannel(channelId, userId);
    channel.name = requestBody.name;
    await UserChannel.update(channel, ['name']);

    const responseBody = new SuccessResponse(channel).build();
    res.json(responseBody);
  })
);

router.delete(
  '/:id',
  RequestTimer('/api/v1/profiles/channels/:id'),
  AsyncMiddleware(async (req, res) => {
    const userId = req.userId;
    const channelId = req.params.id;
    await deleteChannel(channelId, userId);

    const responseBody = new SuccessResponse().build();
    res.json(responseBody);
  })
);

async function getChannels(userId) {
  const channels = await UserChannel.getByUserId(userId);

  const promises = channels.map((channel) => {
    return buildChannelResponseModel(channel);
  });

  return await Promise.all(promises);
}

async function getChannel(id, userId) {
  const channel = await UserChannel.getByIdAndUserId(id, userId);

  if (!channel) {
    console.error(`Cannot find channel by Id ${id} for user ${userId}`);
    throw new NotFoundError('Cannot find channel');
  }

  return buildChannelResponseModel(channel);
}

async function deleteChannel(id, userId) {
  // TODO: Remove this?
  const channel = await getChannel(id, userId);
  return UserChannel.delete(id);
}

function buildChannel(requestBody) {
  return {
    name: requestBody.name,
    provider_type: requestBody.source.type,
    external_id: requestBody.source.id,
    original_name: requestBody.source.name
  };
}

function validateCreateRequest(requestBody) {
  if (!requestBody.name) {
    console.error('Cannot create channel: name is missing');
    throw new BadRequestError('Input parameter is not complete or invalid');
  }

  const source = requestBody.source;
  if (!(source && source.id && source.type && source.name)) {
    console.error(
      'Cannot create channel: source data is missing:', source
    );
    throw new BadRequestError('Input parameter is not complete or invalid');
  }
  ProviderTypeValidator.validate(source.type);
}

function validateUpdateRequest(requestBody) {
  if (requestBody.name === undefined || requestBody.name.trim().length === 0) {
    console.error('Name parameter is empty:', requestBody);
    throw new BadRequestError('Input parameters empty or invalid');
  }
}

async function checkForChannelDuplicates(requestBody, userId) {
  const name = requestBody.name;
  const id = requestBody.source.id;
  const type = requestBody.source.type;

  const count = await UserChannel.countDuplicate(name, id, type, userId);
  if (count > 0) {
    console.error('Cannot create channel duplicate:', requestBody);
    throw new BadRequestError('Cannot create duplicate channel');
  }
}

async function checkForChannelNameDuplicates(name, userId) {
  const count = await UserChannel.countByNameAndUserId(name, userId);
  if (count > 0) {
    console.error(`Found channel with same name for user:`, userId);
    throw new BadRequestError('Channel with same name already exists');
  }
}

function buildChannelResponseModel(channel) {
  return {
    id: channel.id,
    name: channel.name,
    originalName: channel.original_name,
    providerType: channel.provider_type
  };
}

module.exports = router;
