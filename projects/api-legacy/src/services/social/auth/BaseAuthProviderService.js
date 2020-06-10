const moment = require('moment');
const BadRequestError = require('../../../errors/BadRequestError');
const UserAccountStatusEnum = require('../../../common/enums/UserAccountStatusEnum');
const UserAccount = require('../../../models/userAccount');
const AuthenticationService = require('../../AuthenticationService');

class BaseAuthProviderService {
  async _linkAccount(userId, ...authArgs) {
    const providerAuthData = await this._getProviderAuthData(...authArgs);
    if (!providerAuthData) {
      return false;
    }

    const authData = this._buildAccountAuthData(providerAuthData);
    const providerUserData = await this._getProviderUserData(authData);
    if (!providerUserData) {
      return false;
    }

    const userData = this._buildAccountUserData(providerUserData);
    const accountInUse = await this._isProviderAccountAlreadyInUse(
      this._getProviderType(), userData.id
    );
    if (accountInUse) {
      return false;
    }

    await this._createUserAccount(userId, this._getProviderType(), authData,
      userData);

    return true;
  }

  async _loginWithAccount(...authArgs) {
    const providerAuthData = await this._getProviderAuthData(...authArgs);
    if (!providerAuthData) {
      return;
    }

    const authData = this._buildAccountAuthData(providerAuthData);
    const providerUserData = await this._getProviderUserData(authData);
    if (!providerUserData) {
      return;
    }

    const userData = this._buildAccountUserData(providerUserData);
    const account = await this._getAccountBySocialId(this._getProviderType(),
      userData.id);
    if (!account) {
      console.error('Cannot login user by social id, because cannot find' +
        ' user with this account:', userData.id);
      return;
    }

    return this._processLoginWithProviderData(account, authData, userData);
  }

  async _registerOrLoginWithAccount(...authArgs) {
    const providerAuthData = await this._getProviderAuthData(...authArgs);
    if (!providerAuthData) {
      return;
    }

    const authData = this._buildAccountAuthData(providerAuthData);
    const providerUserData = await this._getProviderUserData(authData);
    if (!providerUserData) {
      return;
    }

    const userData = this._buildAccountUserData(providerUserData);
    const account = await this._getAccountBySocialId(this._getProviderType(),
      userData.id);
    let userId;
    if (account) {
      userId = await this._processLoginWithProviderData(account, authData,
        userData);
    } else {
      userId = await this._processRegistrationWithProviderData(authData,
        userData);
    }

    return userId;
  }

  async _refreshToken(account) {
    const refreshTokenData = await this._getRefreshTokenData(account.auth);
    if (!refreshTokenData) {
      console.warn(`Cannot refresh token for user ${userId}, ` +
        `provider '${this._getProviderType()}'`);
      return;
    }

    const authData = this._buildAccountAuthData(refreshTokenData);
    account.auth = authData;
    return UserAccount.update(account, ['auth']);
  }

  _getProviderType() {
    throw 'Method must be overridden. Direct call not allowed!';
  }

  _isTokenExpired(accountAuthData) {
    const now = moment();
    const expirationDate = accountAuthData.expirationDate;

    return moment(expirationDate).isSameOrBefore(now);
  }

  _buildAccountAuthData(authResponse) {
    const expiresIn = authResponse.expires_in - 10;
    const authData = {
      accessToken: authResponse.access_token,
      refreshToken: authResponse.refresh_token,
      scope: authResponse.scope,
      expiresIn: expiresIn
    };

    authData.expirationDate = moment().add(expiresIn, 'seconds').format();

    return authData;
  }

  async _createUserAccount(userId, providerType, authData, userProviderData) {
    const account = {
      user_id: userId,
      provider_type: providerType,
      status: UserAccountStatusEnum.active
    };

    if (authData) {
      account.auth = authData;
    }
    if (userProviderData) {
      account.user_data = userProviderData;
    }

    return UserAccount.create(account);
  }

  _getBaseApiUrl() {
    return `${process.env.API_BASE_URL}/api/${process.env.API_VERSION}`;
  }

  async _isProviderAccountAlreadyInUse(providerType, socialId) {
    const account = await this._getAccountBySocialId(providerType, socialId);
    return !!account;
  }

  async _getAccountBySocialId(providerType, socialId) {
    return UserAccount.getByProviderTypeAndSocialId(providerType, socialId);
  }

  async _processRegistrationWithProviderData(authData, userData) {
    const {userId} = await AuthenticationService.register();
    await this._createUserAccount(userId, this._getProviderType(), authData,
      userData);

    return userId;
  }

  async _processLoginWithProviderData(account, authData, userData) {
    account.auth = authData;
    account.user_data = userData;
    UserAccount.update(account, ['auth', 'user_data']);

    return account.user_id;
  }
}

module.exports = BaseAuthProviderService;
