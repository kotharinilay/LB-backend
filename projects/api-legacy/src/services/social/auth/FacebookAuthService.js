const axios = require('axios');
const qs = require('qs');
const moment = require('moment');

const BaseAuthProviderService = require('./BaseAuthProviderService');
const ProvidersEnum = require('../../../common/enums/ProvidersEnum');

const CLIENT_ID = process.env.FACEBOOK_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.FACEBOOK_OAUTH_CLIENT_SECRET;
const AUTH_URL = process.env.FACEBOOK_OAUTH_AUTH_URL;
const TOKEN_URL = process.env.FACEBOOK_OAUTH_TOKEN_URL;
const API_BASE_URL = process.env.FACEBOOK_API_BASE_URL;

class FacebookAuthService extends BaseAuthProviderService {
  constructor() {
    super();
    this.oauthRedirectUrl = super._getBaseApiUrl() +
      '/profiles/accounts/facebook/validate';
  }

  getAuthUrl(state) {
    const requestData = qs.stringify({
      client_id: CLIENT_ID,
      redirect_uri: this.oauthRedirectUrl,
      state: state,
      scope: 'email,user_likes'
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
    return ProvidersEnum.facebook;
  }

  async _getProviderAuthData(code) {
    const requestData = qs.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: this.oauthRedirectUrl,
      code: code
    });
    const config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };

    return axios.post(TOKEN_URL, requestData, config)
      .then((response) => response.data)
      .catch((error) => {
        console.error('Error occurred while interaction with Facebook:', error);
      });
  }

  async _getProviderUserData(accountAuthData) {
    const url = `${API_BASE_URL}/me?access_token=${accountAuthData.accessToken}`;
    return axios.get(url)
      .then((response) => response.data)
      .catch((error) => {
        console.error(
          'Error occurred while getting user information from Facebook', error
        );
      });
  }

  _buildAccountUserData(userResponse) {
    return {
      id: userResponse.id,
      displayName: userResponse.name
    };
  }

  _buildAccountAuthData(authResponse) {
    const expiresIn = authResponse.expires_in - 10;
    const authData = {
      accessToken: authResponse.access_token,
      expiresIn: expiresIn
    };
    authData.expirationDate = moment().add(expiresIn, 'seconds').format();

    return authData;
  }
}

const instance = new FacebookAuthService();
module.exports = instance;
