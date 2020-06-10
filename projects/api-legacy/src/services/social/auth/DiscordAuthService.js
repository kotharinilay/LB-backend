const axios = require('axios');
const qs = require('qs');

const BaseAuthProviderService = require('./BaseAuthProviderService');
const ProvidersEnum = require('../../../common/enums/ProvidersEnum');

const CLIENT_ID = process.env.DISCORD_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_OAUTH_CLIENT_SECRET;
const AUTH_URL = process.env.DISCORD_OAUTH_AUTH_URL;
const TOKEN_URL = process.env.DISCORD_OAUTH_TOKEN_URL;
const API_BASE_URL = process.env.DISCORD_API_BASE_URL;
const SCOPE = 'identify email guilds';

class DiscordAuthService extends BaseAuthProviderService {
  constructor() {
    super();
    this.oauthRedirectUrl = super._getBaseApiUrl() +
      '/profiles/accounts/discord/validate';
  }

  getAuthUrl(state) {
    const requestData = qs.stringify({
      client_id: CLIENT_ID,
      redirect_uri: this.oauthRedirectUrl,
      state: state,
      response_type: 'code',
      scope: SCOPE,
      prompt: 'consent'
    });

    return AUTH_URL + '?' + requestData;
  }

  async linkAccount(userId, code) {
    return super._linkAccount(userId, code);
  }

  async loginWithAccount(code) {
    return super._loginWithAccount(code);
  }

  async registerWithAccount(code) {
    return super._registerOrLoginWithAccount(code);
  }

  async refreshToken(account) {
    if (super._isTokenExpired(account.auth)) {
      super._refreshToken(account);
    }
  }

  _getProviderType() {
    return ProvidersEnum.discord;
  }

  async _getProviderAuthData(code) {
    const requestData = qs.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: this.oauthRedirectUrl,
      code: code,
      grant_type: 'authorization_code',
      scope: SCOPE
    });
    const config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };

    return axios.post(TOKEN_URL, requestData, config)
      .then((response) => response.data)
      .catch((error) => {
        console.error('Error occurred while interaction with Discord:', error);
      });
  }

  async _getProviderUserData(accountAuthData) {
    const config = {
      headers: {
        'Authorization': 'Bearer ' + accountAuthData.accessToken
      }
    };

    return axios.get(API_BASE_URL + '/users/@me', config)
      .then((response) => response.data)
      .catch((error) => {
        console.error(
          'Error occurred while getting user information from Discord', error
        );
      });
  }

  async _getRefreshTokenData(accountAuthData) {
    const requestData = qs.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: accountAuthData.refreshToken,
      redirect_uri: this.oauthRedirectUrl,
      grant_type: 'refresh_token',
      scope: SCOPE
    });
    const config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };

    return axios.post(TOKEN_URL, requestData, config)
      .then((response) => response.data)
      .catch((error) => {
        console.error('Error occurred while refreshing token on Discord:',
          error);
      });
  }

  _buildAccountUserData(userResponse) {
    const result = {
      id: userResponse.id,
      login: userResponse.username,
      displayName: userResponse.username + '#' + userResponse.discriminator
    };

    if (userResponse.email) {
      result.email = userResponse.email.toLowerCase();
    }

    return result;
  }
}

const instance = new DiscordAuthService();
module.exports = instance;
