const moment = require('moment');

const NotFoundError = require('../../errors/NotFoundError');

const Cinematic = require('../../models/cinematic');

class CinematicsService {

  async getVideos(userId) {
    const results = await Cinematic.getByUserId(userId);
    return results;
  }

  async newVideo(data) {
    return await Cinematic.create(data);
  }

}

const instance = new CinematicsService();
module.exports = instance;