const NotFoundError = require('../errors/NotFoundError');
const UserVideo = require('../models/userVideo');

class UserVideoService {
  async getVideo(id, userId, ignoreStatus = false) {
    const video = await UserVideo.getByIdAndUserId(id, userId, ignoreStatus);

    if (!video) {
      console.error('Cannot get video by Id:', id);
      throw new NotFoundError('Cannot find video');
    }

    return video;
  }
}

const instance = new UserVideoService();
module.exports = instance;