const axios = require('axios');
const qs = require('qs');

const BaseAuthProviderService = require('./BaseAuthProviderService');
const ProvidersEnum = require('../../../common/enums/ProvidersEnum');

const CLIENT_ID = process.env.SNAPCHAT_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.SNAPCHAT_OAUTH_CLIENT_SECRET;
const AUTH_URL = process.env.SNAPCHAT_OAUTH_AUTH_URL;
const TOKEN_URL = process.env.SNAPCHAT_OAUTH_TOKEN_URL;
const API_BASE_URL = process.env.SNAPCHAT_API_BASE_URL;

class SnapchatAuthService extends BaseAuthProviderService {
  constructor() {
    super();
    this.oauthRedirectUrl = super._getBaseApiUrl() +
      '/profiles/accounts/snapchat/validate';
    this.base16AuthHeaderValue = 'Basic ' +
      Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64');
  }

  getAuthUrl(state) {
    const requestData = qs.stringify({
      client_id: CLIENT_ID,
      redirect_uri: this.oauthRedirectUrl,
      state: state,
      response_type: 'code',
      scope: 'https://auth.snapchat.com/oauth2/api/user.display_name ' +
        'https://auth.snapchat.com/oauth2/api/user.bitmoji.avatar'
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

  _getProviderType() {
    return ProvidersEnum.snapchat;
  }

  async _getProviderAuthData(code) {
    const requestData = qs.stringify({
      redirect_uri: this.oauthRedirectUrl,
      code: code,
      grant_type: 'authorization_code'
    });
    const config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': this.base16AuthHeaderValue
      }
    };

    return axios.post(TOKEN_URL, requestData, config)
      .then((response) => response.data)
      .catch((error) => {
        console.error('Error occurred while interaction with Snapchat:', error);
      });
  }

  async _getProviderUserData(accountAuthData) {
    const requestBody = {
      query: '{me{displayName bitmoji{avatar} externalId}}'
    };
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + accountAuthData.accessToken
      }
    };

    return axios.post(API_BASE_URL + '/me', requestBody, config)
      .then((response) => response.data.data)
      .catch((error) => {
        console.error(
          'Error occurred while getting user information from Snapchat', error
        );
      });
  }

  _buildAccountUserData(userResponse) {
    return {
      id: userResponse.externalId,
      login: userResponse.displayName,
      displayName: userResponse.displayName
    };
  }
}

const instance = new SnapchatAuthService();
module.exports = instance;
