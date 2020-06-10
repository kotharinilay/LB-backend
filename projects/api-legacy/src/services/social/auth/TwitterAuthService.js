const axios = require('axios');
const qs = require('qs');
const OAuth = require('oauth-1.0a');
const crypto = require('crypto');

const BadGatewayError = require('../../../errors/BadGatewayError');
const BaseAuthProviderService = require('./BaseAuthProviderService');
const ProvidersEnum = require('../../../common/enums/ProvidersEnum');

const APP_KEY = process.env.TWITTER_OAUTH_CLIENT_ID;
const APP_SECRET = process.env.TWITTER_OAUTH_CLIENT_SECRET;
const OAUTH_BASE_URL = process.env.TWITTER_OAUTH_BASE_OAUTH_URL;
const API_BASE_URL = process.env.TWITTER_API_BASE_URL;

const oauth = OAuth({
    consumer: {
        key: APP_KEY,
        secret: APP_SECRET
    },
    signature_method: 'HMAC-SHA1',
    hash_function(baseString, key) {
        return crypto
            .createHmac('sha1', key)
            .update(baseString)
            .digest('base64');
    }
});

class TwitterAuthService extends BaseAuthProviderService {
  constructor() {
    super();
    this.oauthRedirectUrl = super._getBaseApiUrl() +
      '/profiles/accounts/twitter/validate';
  }

  async getAuthUrl() {
    let oauthToken;
    const requestData = {
      url: `${OAUTH_BASE_URL}/request_token`,
      method: 'POST',
      data: {
        oauth_callback: this.oauthRedirectUrl
      }
    };
    const config = {
      headers: oauth.toHeader(oauth.authorize(requestData))
    };

    await axios.post(requestData.url, undefined, config)
      .then((response) => {
        const parsed = qs.parse(response.data);

        if (parsed.oauth_callback_confirmed !== 'true') {
          console.warn('Possibly not success response from Twitter on ' +
            'request token:', parsed);
        }

        oauthToken = parsed.oauth_token;
      })
      .catch((error) => {
        console.error('Cannot get request token from Twitter:', error);
        throw new BadGatewayError('Cannot send request to Twitter');
      });

    if (!oauthToken) {
      console.error('Request token from Twitter incorrect:', oauthToken);
      throw new BadGatewayError('Cannot parse request from Twitter');
    }

    return {
      url: `${OAUTH_BASE_URL}/authorize?oauth_token=${oauthToken}`,
      oauthToken: oauthToken
    };
  }

  async linkAccount(userId, oauthToken, oauthVerifier) {
    return super._linkAccount(userId, oauthToken, oauthVerifier);
  }

  async loginWithAccount(oauthToken, oauthVerifier) {
    return super._loginWithAccount(oauthToken, oauthVerifier);
  }

  async registerWithAccount(oauthToken, oauthVerifier) {
    return super._registerOrLoginWithAccount(oauthToken, oauthVerifier);
  }

  _getProviderType() {
    return ProvidersEnum.twitter;
  }

  async _getProviderAuthData(oauthToken, oauthVerifier) {
    const requestData = qs.stringify({
      oauth_token: oauthToken,
      oauth_verifier: oauthVerifier
    });

    return axios.post(`${OAUTH_BASE_URL}/access_token`, requestData)
      .then((response) => response.data)
      .catch((error) => {
        console.error('Error occurred while interaction with Twitter:', error);
      });
  }

  async _getProviderUserData(accountAuthData) {
    const requestData = {
      url: `${API_BASE_URL}/account/verify_credentials.json`,
      method: 'GET',
      data: {
        oauth_token: accountAuthData.accessToken
      }
    };
    const token = this._buildSignRequestToken(accountAuthData.accessToken,
      accountAuthData.accessTokenSecret);
    const config = {
      headers: oauth.toHeader(oauth.authorize(requestData, token))
    };

    return axios.get(requestData.url, config)
      .then((response) => response.data)
      .catch((error) => {
        console.error(
          'Error occurred while getting user information from Twitter', error
        );
      });
  }

  _buildAccountUserData(userResponse) {
    return {
      id: userResponse.id_str,
      login: userResponse.screen_name,
      displayName: userResponse.name
    };
  }

  _buildAccountAuthData(authResponse) {
    const parsed = qs.parse(authResponse);

    return {
      accessToken: parsed.oauth_token,
      accessTokenSecret: parsed.oauth_token_secret
    };
  }

  _buildSignRequestToken(accessToken, accessTokenSecret) {
    return {
      key: accessToken,
      secret: accessTokenSecret
    };
  }
}

const instance = new TwitterAuthService();
module.exports = instance;
