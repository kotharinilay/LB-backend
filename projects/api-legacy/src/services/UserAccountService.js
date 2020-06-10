const UserAccount = require('../models/userAccount');
const NotFoundError = require('../errors/NotFoundError');

class UserAccountService {
  async getUserAccount(userId, providerType) {
    const account = await UserAccount.getByUserIdAndProviderType(userId,
      providerType);

    if (!account) {
      console.error(`Cannot find user account. UserId: '${userId}', ` +
        `providerType: '${providerType}'`);
      throw new NotFoundError('Cannot find user account');
    }

    return account;
  }
}

const instance = new UserAccountService();
module.exports = instance;
