const axios = require('axios');
const qs = require('qs');

const BaseAuthProviderService = require('./BaseAuthProviderService');
const ProvidersEnum = require('../../../common/enums/ProvidersEnum');

const CLIENT_ID = process.env.INSTAGRAM_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.INSTAGRAM_OAUTH_CLIENT_SECRET;
const AUTH_URL = process.env.INSTAGRAM_OAUTH_AUTH_URL;
const TOKEN_URL = process.env.INSTAGRAM_OAUTH_TOKEN_URL;
const API_BASE_URL = process.env.INSTAGRAM_API_BASE_URL;

class InstagramAuthService extends BaseAuthProviderService {
  constructor() {
    super();
    this.oauthRedirectUrl = super._getBaseApiUrl() +
      '/profiles/accounts/instagram/validate';
  }

  getAuthUrl(state) {
    const requestData = qs.stringify({
      client_id: CLIENT_ID,
      redirect_uri: this.oauthRedirectUrl,
      state: state,
      response_type: 'code',
      scope: 'basic'
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
    return ProvidersEnum.instagram;
  }

  async _getProviderAuthData(code) {
    const requestData = qs.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: this.oauthRedirectUrl,
      code: code,
      grant_type: 'authorization_code'
    });
    const config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };

    return axios.post(TOKEN_URL, requestData, config)
      .then((response) => response.data)
      .catch((error) => {
        console.error('Error occurred while interaction with Instagram:',
          error);
      });
  }

  async _getProviderUserData(accountAuthData) {
    const url = `${API_BASE_URL}/users/self` +
      `?access_token=${accountAuthData.accessToken}`;
    return axios.get(url)
      .then((response) => response.data.data)
      .catch((error) => {
        console.error(
          'Error occurred while getting user information from Instagram', error
        );
      });
  }

  _buildAccountUserData(userResponse) {
    return {
      id: userResponse.id,
      login: userResponse.username,
      displayName: userResponse.full_name
    };
  }

  _buildAccountAuthData(authResponse) {
    return {
      accessToken: authResponse.access_token
    };
  }
}

const instance = new InstagramAuthService();
module.exports = instance;
