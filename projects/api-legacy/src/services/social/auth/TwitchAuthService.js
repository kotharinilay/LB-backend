const axios = require('axios');
const moment = require('moment');
const qs = require('qs');

const BadGatewayError = require('../../../errors/BadGatewayError');
const BaseAuthProviderService = require('./BaseAuthProviderService');
const ProvidersEnum = require('../../../common/enums/ProvidersEnum');

const CLIENT_ID = process.env.TWITCH_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITCH_OAUTH_CLIENT_SECRET;
const AUTH_URL = process.env.TWITCH_OAUTH_AUTH_URL;
const TOKEN_URL = process.env.TWITCH_OAUTH_TOKEN_URL;
const API_BASE_URL = process.env.TWITCH_API_BASE_URL;

class TwitchAuthService extends BaseAuthProviderService {
  constructor() {
    super();
    this.oauthRedirectUrl = super._getBaseApiUrl() +
      '/profiles/accounts/twitch/validate';
  }

  getAuthUrl(state) {
    const requestData = qs.stringify({
      client_id: CLIENT_ID,
      redirect_uri: this.oauthRedirectUrl,
      state: state,
      response_type: 'code',
      scope: 'user:read:email'
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
    return ProvidersEnum.twitch;
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
        console.error('Error occurred while interaction with Twitch:', error);
      });
  }

  async _getProviderUserData(accountAuthData) {
    const config = {
      headers: {
        'Authorization': 'Bearer ' + accountAuthData.accessToken
      }
    };

    return axios.get(API_BASE_URL + '/users', config)
      .then((response) => response.data.data[0])
      .catch((error) => {
        console.error(
          'Error occurred while getting user information from Twitch', error
        );
      });
  }

  _buildAccountUserData(userResponse) {
    const result = {
      id: userResponse.id,
      login: userResponse.login,
      displayName: userResponse.display_name
    };

    if (userResponse.email) {
      result.email = userResponse.email.toLowerCase();
    }

    return result;
  }

  /*
  * DEPRECATED *
   */
  async refreshToken(userId, providerData) {
    if (!super._isTokenExpired(providerData)) {
      return;
    }

    const requestData = qs.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: providerData.auth.refreshToken,
      grant_type: 'refresh_token'
    });
    const config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };

    await axios(TOKEN_URL, requestData, config)
      .then((response) => {
        providerData.auth.accessToken = response.data.access_token;
        providerData.auth.refreshToken = response.data.refresh_token;
        providerData.auth.expirationDate =
          moment(providerData.auth.expirationDate)
            .add(providerData.auth.expiresIn, 'seconds').format();

        // User.update(userId, {
        //   accounts: {
        //     twitch: providerData
        //   }
        // });
      })
      .catch((error) => {
        console.error('Cannot complete request to Twitch.', error);
        throw new BadGatewayError('Cannot complete request to Twitch.');
      });
  }
}

const instance = new TwitchAuthService();
module.exports = instance;
