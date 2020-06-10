const NotFoundError = require('../errors/NotFoundError');
const User = require('../models/user');

class UserService {
  async getUser(userId) {
    const user = await User.getById(userId);

    if (!user) {
      console.error('User not found. Id:', userId);
      throw new NotFoundError('Cannot find user');
    }

    return user;
  }
}

const instance = new UserService();
module.exports = instance;
