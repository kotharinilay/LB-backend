const axios = require('axios');
const {google} = require('googleapis');
const moment = require('moment');

const BaseAuthProviderService = require('./BaseAuthProviderService');
const ProvidersEnum = require('../../../common/enums/ProvidersEnum');

const SCOPES = ['https://www.googleapis.com/auth/userinfo.profile'];
const CLIENT_ID = process.env.YOUTUBE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.YOUTUBE_OAUTH_CLIENT_SECRET;
const API_BASE_URL = process.env.YOUTUBE_API_BASE_URL;

class YoutubeAuthService extends BaseAuthProviderService {
  constructor() {
    super();
    const oauthRedirectUrl = super._getBaseApiUrl() +
      '/profiles/accounts/youtube/validate';
    this.OAUTH2_CLIENT = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET,
      oauthRedirectUrl);
  }

  getAuthUrl(state) {
    return this.OAUTH2_CLIENT.generateAuthUrl({
      scope: SCOPES,
      state: state,
      access_type: 'offline',
      prompt: 'consent select_account',
      include_granted_scopes: true
    });
  }

  async linkAccount(userId, code) {
    return super._linkAccount(userId, code);
  }

  _getProviderType() {
    return ProvidersEnum.youtube;
  }

  async _getProviderAuthData(code) {
    return this.OAUTH2_CLIENT.getToken(code)
      .then((response) => response.tokens)
      .catch((error) => {
        console.error('Error occurred while interaction with Youtube:',
          error);
        return false;
      });
  }

  async _getProviderUserData(accountAuthData) {
    const config = {
      headers: {
        'Authorization': 'Bearer ' + accountAuthData.accessToken
      }
    };

    await axios.get(`${API_BASE_URL}/oauth2/v3/userinfo`, config)
      .then((response) => response.data)
      .catch((error) => {
        console.error(
          'Error occurred while getting user information from Youtube', error
        );
      });
  }

  _buildAccountUserData(userResponse) {
    const result = {
      id: userResponse.sub,
      displayName: userResponse.name
    };

    if (userResponse.email) {
      result.email = userResponse.email.toLowerCase();
    }

    return result;
  }

  _buildAccountAuthData(authResponse) {
    return {
      accessToken: authResponse.access_token,
      refreshToken: authResponse.refresh_token,
      idToken: authResponse.id_token,
      expirationDate: moment(authResponse.expiry_date).format()
    };
  }
}

const instance = new YoutubeAuthService();
module.exports = instance;
