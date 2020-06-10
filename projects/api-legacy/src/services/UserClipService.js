const moment = require('moment');
const validator = require('validator');
const NotFoundError = require('../errors/NotFoundError');
const UserClip = require('../models/userClip');
const UserClipMetadata = require('../models/userClipMetadata');
const ClipTypeEnum = require('../common/enums/ClipTypeEnum');
const ClipStatusEnum = require('../common/enums/ClipStatusEnum');

class UserClipService {
  /**
   * Gets clip by id.
   * IMPORTANT: Only clip owner should have access to it. Please carefully
   * use this method
   * @param id - Clip id
   * @returns {Promise<*>} Clip entity
   */
  async getClipById(id) {
    const clip = await UserClip.getById(id);

    if (!clip) {
      console.error('Cannot find clip by Id:', id);
      throw new NotFoundError('Cannot find clip');
    }

    return clip;
  }

  /**
   * Gets clip by Id for user
   * @param id - Clip Id
   * @param userId - User Id
   * @param ignoreStatus - True if require access even not completed clips
   * @throws {NotFoundError}
   * @returns {Promise<*>} Clip entity
   */
  async getClipByIdAndUserId(id, userId, ignoreStatus = false) {
    const clip = await UserClip.getByIdAndUserId(id, userId, ignoreStatus);

    if (!clip) {
      console.error('Cannot get clip by Id:', id);
      throw new NotFoundError('Cannot find clip');
    }

    return clip;
  }

  /**
   * Gets all the streamers the user have indexed
   * @param userId - User Id
   * @throws {NotFoundError}
   * @returns {Promise<*>} Clip entity
   */
  async getStreamers(userId) {
    const streamers = await UserClip.getStreamers(userId);

    if (!streamers) {
      console.error('User didn\'t index any streams');
      throw new NotFoundError('User didn\'t index any streams');
    }

    return streamers;
  }

  /**
   * Mark a clip in our database as 'DELETED' so it no longer
   * shows up in the front end system. This is a 'soft' delete,
   * and doesn't actually remove the files in case they are needed
   * for bookkeeping/admin purposes (TTD)
   *
   * @param {number} id The unique id of the video clip
   * @param {number} userId The unique id of the user requesting the action
   */
  async deleteClipByIdAndUserId(id, userId) {
    let clip;
    try {
      clip = await this.getClipByIdAndUserId(id, userId);
    } catch(err) {
      return;
    }

    // Remove clip metadata if any exists. It won't be requested ever again
    await UserClipMetadata.deleteByClipId(clip.id);

    // Soft delete the clip in the DB
    await UserClip.delete(clip.id);
  }

  async createAuto(requestBody) {
    if (!isRequestBodyValid(requestBody)) {
      console.error('Request for create auto clip is not valid:', requestBody);
      return;
    }

    const {
      clientId,
      name,
      gameName,
      gameMode,
      url,
      type,
      thumbnailPath,
      thumbnailUrl,
      labels,
      metadata,
      tags,
      streamId,
      path,
      streamerName,
      aiTitle,
      createdDate = moment().format()
    } = requestBody;

    var gameNameToUse = "Fortnite";

    if (gameName == "valorant") {
      gameNameToUse = "Valorant";
    } else if (gameName == "warzone") {
      gameNameToUse = "Warzone";
    }

    const clip = {
      name,
      channel_id: null,
      game_name: gameNameToUse,
      game_mode: gameMode,
      url,
      type : type || ClipTypeEnum.auto,
      thumbnail_path: thumbnailPath,
      thumbnail_url: thumbnailUrl,
      labels,
      metadata,
      path,
      tags,
      ai_title: aiTitle,
      streamer_name: streamerName,
      stream_id: streamId,
      user_id: clientId,
      created_date: createdDate,
      status: ClipStatusEnum.completed
    };

    return UserClip.create(clip);
  }
}

function isRequestBodyValid(requestBody) {
  if (requestBody.clientId == null) {
    console.error('Missing clientId');
    return false;
  }

  if (isNaN(requestBody.clientId)) {
    console.error('client id is NaN');
    return false;
  }

  if (!validator.isURL(requestBody.url)) {
    console.error('bad URL');
    return false;
  }

  return true;
}

const instance = new UserClipService();
module.exports = instance;
