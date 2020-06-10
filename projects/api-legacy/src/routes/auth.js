const express = require('express');
const router = express.Router();

const validator = require('validator');
const moment = require('moment');

const {authPresenceFilter} = require('../common/middlewares/AuthFilter');
const AuthenticationService = require('../services/AuthenticationService');
const UnauthorizedError = require('../errors/UnauthorizedError');
const BadRequestError = require('../errors/BadRequestError');
const AsyncMiddleware = require('../common/middlewares/AsyncMiddleware');
const SuccessResponse = require('../common/SuccessResponse');
const ProvidersEnum = require('../common/enums/ProvidersEnum');
const SocialLoginActionEnum = require('../common/enums/SocialLoginActionEnum');
const ProviderTypeValidator = require('../common/validator/ProviderTypeValidator');
const SocialLogin = require('../models/socialLogin');
const UserLink = require('../models/userLink');

const TwitchAuthService = require('../services/social/auth/TwitchAuthService');
const DiscordAuthService = require('../services/social/auth/DiscordAuthService');
const InstagramAuthService = require('../services/social/auth/InstagramAuthService');
const FacebookAuthService = require('../services/social/auth/FacebookAuthService');
const TwitterAuthService = require('../services/social/auth/TwitterAuthService');
const YoutubeAuthService = require('../services/social/auth/YoutubeAuthService');
const RequestTimer = require('../common/middlewares/RequestTimer')

const USER_LINK_LIFETIME_SECONDS = 60;

router.post(
  '/register',
  RequestTimer(),
  AsyncMiddleware(async (req, res) => {
    let userData = req.body;

    if (!validateAuthRequest(userData)) {
      console.warn(
        "Can't authenticate user: one of required parameters missing or incorrect"
      );
      throw new UnauthorizedError(
        'One of required parameters missing or incorrect'
      );
    }

    let authData = await AuthenticationService.register(userData),
      responseBody = new SuccessResponse(authData).build();

    res.json(responseBody);
  })
);

router.post(
  '/login',
  RequestTimer(),
  AsyncMiddleware(async (req, res) => {
    let userData = req.body;

    if (!validateAuthRequest(userData)) {
      console.warn(
        "Can't authenticate user: one of required parameters missing or incorrect"
      );
      throw new UnauthorizedError(
        'One of required parameters missing or incorrect'
      );
    }

    let authData = await AuthenticationService.login(userData),
      responseBody = new SuccessResponse(authData).build();

    res.json(responseBody);
  })
);

router.put(
  '/token',
  authPresenceFilter,
  RequestTimer(),
  AsyncMiddleware(async (req, res) => {
    let token = req.header('Authorization').split('Bearer ')[1],
      newToken = await AuthenticationService.refreshToken(token),
      responseBody = new SuccessResponse({
        token: newToken
      }).build();

    res.json(responseBody);
  })
);

router.get(
  '/register/authentication',
  RequestTimer(),
  AsyncMiddleware(async (req, res) => {
    let redirectUrl = await processSocialLogin(
      req,
      SocialLoginActionEnum.register
    );

    res.redirect(redirectUrl);
  })
);

router.get(
  '/login/authentication',
  RequestTimer(),
  AsyncMiddleware(async (req, res) => {
    let redirectUrl = await processSocialLogin(
      req,
      SocialLoginActionEnum.login
    );

    res.redirect(redirectUrl);
  })
);

router.get(
  '/credentials',
  RequestTimer(),
  AsyncMiddleware(async (req, res) => {
    const token = req.query.token;

    if (!token) {
      console.error('Token is incorrect:', token);
      throw new BadRequestError('Token is empty or incorrect');
    }

    const userLink = await UserLink.getByToken(token);
    if (!userLink) {
      console.error('Cannot find UserLink by provided token:', token);
      throw new BadRequestError('Cannot find entity by token');
    }

    const createdDate = moment.utc(userLink.created_date);
    if (
      moment()
        .subtract(USER_LINK_LIFETIME_SECONDS, 'seconds')
        .isAfter(createdDate)
    ) {
      UserLink.delete(userLink.id);

      console.error('Object is expired:', userLink);
      throw new BadRequestError('Entity lifetime expired');
    }

    UserLink.delete(userLink.id);
    const responseData = AuthenticationService.getCredentials(userLink.user_id);

    const responseBody = new SuccessResponse(responseData).build();
    res.json(responseBody);
  })
);

router.post(
  '/password/reset',
  RequestTimer(),
  AsyncMiddleware(async (req, res) => {
    const {email} = req.body;

    await AuthenticationService.resetPassword(email);

    res.send();
  })
);

router.put(
  '/password/reset',
  RequestTimer(),
  AsyncMiddleware(async (req, res) => {
    const {token, password} = req.body;

    if (!token || !password) {
      console.error('Input data is incomplete:', req.body);
      throw new BadRequestError('Input data is incomplete');
    }

    await AuthenticationService.refreshPassword(token, password);

    res.send();
  })
);

function validateAuthRequest(userData) {
    if(userData && userData.type && (userData.type === "twitch" || userData.type === "google" || userData.type === "discord" || userData.type === "instagram") ){

      return (
        validateValueNotEmpty(userData, 'code')
      );

    }else{

      return (
        validateValueNotEmpty(userData, 'email') &&
        validator.isEmail(userData.email) &&
        validateValueNotEmpty(userData, 'password')
      );

    }
}

function validateValueNotEmpty(object, key) {
    let value = object[key];

    return !!value && value.trim().length > 0;
}

async function processSocialLogin(req, action) {
  const providerType = req.query.providerType;
  ProviderTypeValidator.validate(providerType);

  const state = Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(11, 15);
  const socialLoginData = {
    token: state,
    provider_type: providerType,
    action: action
  };
  let redirectUrl;

  if (ProvidersEnum.twitch === providerType) {
    redirectUrl = TwitchAuthService.getAuthUrl(state);
  } else if (ProvidersEnum.discord === providerType) {
    redirectUrl = DiscordAuthService.getAuthUrl(state);
  } else if (ProvidersEnum.instagram === providerType) {
    redirectUrl = InstagramAuthService.getAuthUrl(state);
  } else if (ProvidersEnum.facebook === providerType) {
    redirectUrl = FacebookAuthService.getAuthUrl(state);
  } else if (ProvidersEnum.twitter === providerType) {
    const urlData = await TwitterAuthService.getAuthUrl();
    redirectUrl = urlData.url;
    socialLoginData.token = urlData.oauthToken;
  } else if (ProvidersEnum.youtube === providerType) {
    redirectUrl = YoutubeAuthService.getAuthUrl(state);
  } else {
    console.error(
      'Not supported providerType for social login', providerType
    );
    throw new BadRequestError('ProviderType not supported for this action');
  }

  await SocialLogin.create(socialLoginData);

  return redirectUrl;
}

module.exports = router;
