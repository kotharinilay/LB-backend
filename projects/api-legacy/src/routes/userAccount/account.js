const express = require('express');
const router = express.Router({mergeParams: true});

const {authFilter} = require('../../common/middlewares/AuthFilter');
const AsyncMiddleware = require('../../common/middlewares/AsyncMiddleware');
const BadRequestError = require('../../errors/BadRequestError');
const NotFoundError = require('../../errors/NotFoundError');
const SuccessResponse = require('../../common/SuccessResponse');
const ProvidersEnum = require('../../common/enums/ProvidersEnum');
const SocialLoginActionEnum = require('../../common/enums/SocialLoginActionEnum');
const UserAccountStatusEnum = require('../../common/enums/UserAccountStatusEnum');
const ProviderTypeValidator = require('../../common/validator/ProviderTypeValidator');
const AccountState = require('../../models/accountState');
const SocialLogin = require('../../models/socialLogin');
const UserLink = require('../../models/userLink');
const UserAccount = require('../../models/userAccount');

const TwitchAuthService = require('../../services/social/auth/TwitchAuthService');
const DiscordAuthService = require('../../services/social/auth/DiscordAuthService');
const InstagramAuthService = require('../../services/social/auth/InstagramAuthService');
const FacebookAuthService = require('../../services/social/auth/FacebookAuthService');
const TwitterAuthService = require('../../services/social/auth/TwitterAuthService');
const YoutubeAuthService = require('../../services/social/auth/YoutubeAuthService');
const SnapchatAuthService = require('../../services/social/auth/SnapchatAuthService');
const AESEncryptionService = require('../../services/AESEncryptionService');
const UserService = require('../../services/UserService');

router.get('/', authFilter, AsyncMiddleware(async (req, res) => {
  const userId = req.userId;
  const accounts = await UserAccount.getByUserId(userId);

  const responseData = accounts.map((account) =>
    buildAccountResponseModel(account));
  const responseBody = new SuccessResponse({
    data: responseData
  })
    .build();
  res.json(responseBody);
}));

router.get('/:providerType', authFilter, AsyncMiddleware(async (req, res) => {
  const providerType = req.params.providerType;
  const userId = req.userId;

  ProviderTypeValidator.validate(providerType);
  const account = await UserAccount.getByUserIdAndProviderType(userId,
    providerType);

  if (!account) {
    console.info(`Cannot find account '${providerType}' for user ${userId}`);
    throw new NotFoundError('Cannot find account');
  }

  const responseBody = new SuccessResponse(
    buildAccountResponseModel(account)
  )
    .build();
  res.json(responseBody);
}));

router.post('', authFilter, AsyncMiddleware(async (req, res) => {
  const userId = req.userId;
  const requestBody = req.body;
  const {id, source, name} = requestBody;

  if (!validateCreateRequest(requestBody)) {
    console.error('Request to create account is not correct:', requestBody);
    throw new BadRequestError('Some input parameters empty or incorrect');
  }
  await checkIfUserAlreadyLinkAccountForProvider(userId, source);

  const data = {
    provider_type: source,
    status: UserAccountStatusEnum.active,
    user_data: {
      displayName: name,
      login: name,
      id: id
    },
    user_id: userId
  };
  await UserAccount.create(data);

  const responseBody = new SuccessResponse().build();
  res.json(responseBody);
}));

router.delete('/:providerType', authFilter,
  AsyncMiddleware(async (req, res) => {
    const userId = req.userId;
    const providerType = req.params.providerType;

    ProviderTypeValidator.validate(providerType);
    const account = await UserAccount.getByUserIdAndProviderType(userId,
      providerType);

    if (!account) {
      console.info(`Cannot find account '${providerType}' for user ${userId}`);
      throw new NotFoundError('Cannot find account');
    }
    account.status = UserAccountStatusEnum.deleted;
    await UserAccount.update(account, ['status']);

    const responseBody = new SuccessResponse().build();
    res.json(responseBody);
  }));

router.get('/:providerType/authentication',
  AsyncMiddleware(async (req, res) => {
    const providerType = req.params.providerType;
    const userData = parseToken(req.query.token);
    const userId = userData.userId;

    if (!userId) {
      console.error(`Token do not contain userId. Decoded value: ${userData}`);
      throw new BadRequestError('Some parameters missing in token');
    }
    await UserService.getUser(userId);

    ProviderTypeValidator.validate(providerType);
    await checkIfUserAlreadyLinkAccountForProvider(userId, providerType);

    await AccountState.deleteByUserIdAndProviderType(userId, providerType);

    const state = Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(11, 15);
    const accountStateData = {
      token: state,
      provider_type: providerType,
      user_id: userId
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
      accountStateData.token = urlData.oauthToken;
    } else if (ProvidersEnum.youtube === providerType) {
      redirectUrl = YoutubeAuthService.getAuthUrl(state);
    } else if (ProvidersEnum.snapchat === providerType) {
      redirectUrl = SnapchatAuthService.getAuthUrl(state);
    } else {
      console.error(
        'Not supported providerType for authentication', providerType
      );
      throw new BadRequestError('ProviderType not supported for this action');
    }

    await AccountState.create(accountStateData);

    res.redirect(redirectUrl);
  }));

router.get('/:providerType/validate', AsyncMiddleware(async (req, res) => {
  const state = req.query.state || req.query.oauth_token;
  const code = req.query.code;
  const providerType = req.params.providerType;
  const oauthToken = req.query.oauth_token;
  const oauthVerifier = req.query.oauth_verifier;

  ProviderTypeValidator.validate(providerType);

  if (state === undefined) {
    console.error(
      `One of query parameters missing. State: ${state}, code: ${code}`
    );
    throw new BadRequestError('One of query parameters missing');
  }

  const accountState = await AccountState.getByToken(state);
  const socialLogin = await SocialLogin.getByToken(state);
  if (!accountState && !socialLogin) {
    console.error('Cannot find AccountState or SocialLogin by Id:', state);
    throw new BadRequestError('Cannot find document by state');
  }

  let processed;
  if (accountState) {
    processed = await processAccountLink(accountState, providerType, code,
      oauthToken, oauthVerifier);
  } else {
    processed = await processSocialLogin(socialLogin, providerType, code,
      oauthToken, oauthVerifier);
  }

  res.redirect('gg.wizard.ios.wizard:' + processed.link);
}));

function buildAccountResponseModel(account) {
  return {
    type: account.provider_type,
    login: account.user_data.login,
    displayName: account.user_data.displayName
  };
}

function parseToken(token) {
  let decodedToken;
  try {
    decodedToken = AESEncryptionService.decrypt(token);

    return JSON.parse(decodedToken);
  } catch (error) {
    console.error(
      `Cannot parse token: ${token}, decoded value: ${decodedToken}`
    );
    throw new BadRequestError('Cannot parse token');
  }
}

async function processAccountLink(accountState, providerType, code, oauthToken,
                                  oauthVerifier) {
  const userId = accountState.user_id;
  const stateProviderType = accountState.provider_type;
  let successParam = false;

  if (stateProviderType !== providerType) {
    console.error(`Provider type do not match. Provided: ${providerType},` +
      ` stored: ${stateProviderType}`);
    throw new BadRequestError('Provider type do not match');
  }

  await checkIfUserAlreadyLinkAccountForProvider(userId, providerType);

  if (ProvidersEnum.twitch === providerType) {
    successParam = await TwitchAuthService.linkAccount(userId, code);
  } else if (ProvidersEnum.discord === providerType) {
    successParam = await DiscordAuthService.linkAccount(userId, code);
  } else if (ProvidersEnum.instagram === providerType) {
    successParam = await InstagramAuthService.linkAccount(userId, code);
  } else if (ProvidersEnum.facebook === providerType) {
    successParam = await FacebookAuthService.linkAccount(userId, code);
  } else if (ProvidersEnum.twitter === providerType) {
    successParam = await TwitterAuthService.linkAccount(userId, oauthToken,
      oauthVerifier);
  } else if (ProvidersEnum.youtube === providerType) {
    successParam = await YoutubeAuthService.linkAccount(userId, code);
  } else if (ProvidersEnum.snapchat === providerType) {
    successParam = await SnapchatAuthService.linkAccount(userId, code);
  } else {
    console.error(
      'Not supported providerType for adding account', providerType
    );
    throw new BadRequestError('ProviderType not supported for this action');
  }

  AccountState.delete(accountState.id);

  return {
    link: `//link/${providerType}?success=${successParam}`
  };
}

async function processSocialLogin(socialLogin, providerType, code, oauthToken,
                                  oauthVerifier) {
  const action = socialLogin.action;
  const stateProviderType = socialLogin.provider_type;

  if (stateProviderType !== providerType) {
    console.error(`Provider type do not match. Provided: ${providerType}, ` +
      `stored: ${stateProviderType}`);
    throw new BadRequestError('Provider type do not match');
  }

  let userId;
  if (SocialLoginActionEnum.login === action) {
    userId = await loginUserWithAccount(code, oauthToken, oauthVerifier,
      providerType);
  } else {
    userId = await registerUserWithAccount(code, oauthToken, oauthVerifier,
      providerType);
  }

  const successParam = !!userId;
  let link = `//${action.toLowerCase()}/${providerType}` +
    `?success=${successParam}`;
  if (successParam) {
    const token = Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(11, 15);
    link += `&token=${token}`;

    const userLink = {
      user_id: userId,
      token: token
    };
    await UserLink.create(userLink);
  }

  SocialLogin.delete(socialLogin.id);

  return {
    link: link
  };
}

const checkIfUserAlreadyLinkAccountForProvider =
  async (userId, providerType) => {
    const account = await UserAccount.getByUserIdAndProviderType(userId,
      providerType);
    if (account) {
      console.error(
        `User already have linked account. Provider: ${providerType}`
      );
      throw new BadRequestError(
        'User already have linked account for this provider'
      );
    }
  };

const validateCreateRequest = (requestBody) => {
  const {id, source, name} = requestBody;

  if (!(id && source && name)) {
    console.error('Empty parameters');
    return false;
  }
  ProviderTypeValidator.validate(source);

  return true;
};

async function registerUserWithAccount(code, oauthToken, oauthVerifier,
                                       providerType) {
  let userId;
  if (ProvidersEnum.twitch === providerType) {
    userId = await TwitchAuthService.registerWithAccount(code);
  } else if (ProvidersEnum.discord === providerType) {
    userId = await DiscordAuthService.registerWithAccount(code);
  } else if (ProvidersEnum.instagram === providerType) {
    userId = await InstagramAuthService.registerWithAccount(code);
  } else if (ProvidersEnum.facebook === providerType) {
    userId = await FacebookAuthService.registerWithAccount(code);
  } else if (ProvidersEnum.twitter === providerType) {
    userId = await TwitterAuthService.registerWithAccount(oauthToken,
      oauthVerifier);
  } else if (ProvidersEnum.snapchat === providerType) {
    userId = await SnapchatAuthService.registerWithAccount(oauthToken,
      oauthVerifier);
  } else {
    console.error(
      'Not supported providerType for registration:', providerType
    );
    throw new BadRequestError('ProviderType not supported for this action');
  }

  return userId
}

async function loginUserWithAccount(code, oauthToken, oauthVerifier,
                                    providerType) {
  let userId;
  if (ProvidersEnum.twitch === providerType) {
    userId = await TwitchAuthService.loginWithAccount(code);
  } else if (ProvidersEnum.discord === providerType) {
    userId = await DiscordAuthService.loginWithAccount(code);
  } else if (ProvidersEnum.instagram === providerType) {
    userId = await InstagramAuthService.loginWithAccount(code);
  } else if (ProvidersEnum.facebook === providerType) {
    userId = await FacebookAuthService.loginWithAccount(code);
  } else if (ProvidersEnum.twitter === providerType) {
    userId = await TwitterAuthService.loginWithAccount(oauthToken,
      oauthVerifier);
  } else if (ProvidersEnum.snapchat === providerType) {
    userId = await SnapchatAuthService.loginWithAccount(oauthToken,
      oauthVerifier);
  } else {
    console.error(
      'Not supported providerType for login:', providerType
    );
    throw new BadRequestError('ProviderType not supported for this action');
  }

  return userId;
}

module.exports = router;
