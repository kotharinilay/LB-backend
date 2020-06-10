const axios = require('axios');

const ProvidersEnum = require('../../common/enums/ProvidersEnum');
const BadGatewayError = require('../../errors/BadGatewayError');
const DiscordAuthService = require('../../services/social/auth/DiscordAuthService');
const UserAccountService = require('../../services/UserAccountService');

const API_BASE_URL = process.env.DISCORD_API_BASE_URL;
const AUTH_URL = process.env.DISCORD_OAUTH_AUTH_URL;
const CLIENT_ID = process.env.DISCORD_OAUTH_CLIENT_ID;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const BOT_PERMISSIONS = 34816;
const CDN_BASE_URL = 'https://cdn.discordapp.com';
const CDN_IMAGE_FORMAT = 'jpg';
const CDN_IMAGE_RESOLUTION = '64';
const SUPPORTED_CHANNEL_TYPES = [0, 1, 3];

class DiscordService {
  async getServers(userId) {
    const account = await UserAccountService.getUserAccount(userId,
      ProvidersEnum.discord);
    await DiscordAuthService.refreshToken(account);
    const servers = await getServers(account.auth);

    return servers.map((server) => buildServerModel(server));
  }

  async getChannels(serverId, userId) {
    await UserAccountService.getUserAccount(userId, ProvidersEnum.discord);
    const channels = await getChannels(serverId);

    return channels
      .filter((channel) => SUPPORTED_CHANNEL_TYPES.includes(channel.type))
      .map((channel) => buildChannelModel(channel));
  }

  getBotAuthUrl(serverId) {
    return `${AUTH_URL}?client_id=${CLIENT_ID}&scope=bot` +
      `&permissions=${BOT_PERMISSIONS}&guild_id=${serverId}`;
  }
}

async function getServers(authData) {
  const config = {
    headers: {
      'Authorization': 'Bearer ' + authData.accessToken
    }
  };

  try {
    const response = await axios.get(API_BASE_URL + '/users/@me/guilds',
      config);
    return response.data;
  } catch (error) {
    console.error(
      'Error occurred while getting data about user servers from Discord',
      error
    );
    throw new BadGatewayError("Cannot get list of servers");
  }
}

async function getChannels(serverId) {
  const config = {
    headers: {
      'Authorization': `Bot ` + BOT_TOKEN
    }
  };

  try {
    const response = await axios.get(API_BASE_URL + `/guilds/${serverId}/channels`,
      config);
    return response.data;
  } catch (error) {
    console.error(
      'Error occurred while getting data about channels from Discord',
      error
    );
    throw new BadGatewayError("Cannot get list of channels");
  }
}

function buildServerModel(server) {
  return {
    id: server.id,
    name: server.name,
    logoUrl: buildServeLogoUrl(server.id, server.icon)
  };
}

function buildChannelModel(channel) {
  return {
    id: channel.id,
    name: channel.name
  };
}

function buildServeLogoUrl(serverId, icon) {
  return `${CDN_BASE_URL}/icons/${serverId}/${icon}.${CDN_IMAGE_FORMAT}` +
    `?size=${CDN_IMAGE_RESOLUTION}`;
}

const instance = new DiscordService();
module.exports = instance;
