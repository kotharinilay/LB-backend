const moment = require('moment');

const NotFoundError = require('../errors/NotFoundError');
const UserOverlay = require('../models/userOverlay');
const ThumbnailService = require('../services/ThumbnailService');
const FileStorageFacade = require('../services/storage/FileStorageFacade');

class UserOverlayService {
  async addOverlay(userId, fileData) {
    const {url, path} = await FileStorageFacade.uploadVideoOverlay(
      fileData.originalname, fileData.buffer
    );

    const overlay = {
      url: url,
      path: path,
      user_id: userId
    };
    overlay.id = await UserOverlay.create(overlay);

    createThumbnail(overlay);

    return overlay;
  }

  async getOverlayForUser(id, userId) {
    const overlay = await UserOverlay.getByIdAndUserId(id, userId);

    if (!overlay) {
      console.error(`Cannot find overlay by Id '${id}' for user '${userId}'`);
      throw new NotFoundError('Cannot find overlay');
    }

    return overlay;
  }

  async getOverlay(id) {
    const overlay = await UserOverlay.getById(id);

    if (!overlay) {
      console.error('Cannot find overlay by Id:', id);
      throw new NotFoundError('Cannot find overlay');
    }

    return overlay;
  }

  async getCommonOverlay(id) {
    const overlay = await UserOverlay.getCommonById(id);

    if (!overlay) {
      console.error('Cannot find overlay by Id:', id);
      throw new NotFoundError('Cannot find overlay');
    }

    return overlay;
  }

  async getOverlays(userId, pagingSorting) {
    return UserOverlay.getAllByUserId(userId, pagingSorting);
  }

  async getRecentOverlays(userId, pagingSorting) {
    return UserOverlay.getRecent(userId, pagingSorting);
  }

  async updateLastUsedDate(id, userId) {
    const overlay = await this.getOverlayForUser(id, userId);

    overlay.last_used_date = moment().format();
    UserOverlay.update(overlay, ['last_used_date']);
  }

  async updateThumbnail(id) {
    const overlay = await this.getOverlay(id);

    if (overlay.thumbnail_url) {
      console.error(
        'Cannot update overlay thumbnail, because it is already exist:', id
      );
      throw new BadRequestError('Cannot update overlay thumbnail');
    }

    overlay.thumbnail_url = FileStorageFacade.buildVideoOverlayUrl(
      overlay.thumbnail_path);
    UserOverlay.update(overlay, ['thumbnail_url']);
  }

  async deleteOverlay(id, userId) {
    const overlay = await this.getOverlayForUser(id, userId);

    await UserOverlay.delete(id);
    return FileStorageFacade.deleteVideoOverlay(overlay.path);
  }
}

async function createThumbnail(overlay) {
  const thumbnailPath = await ThumbnailService.createForOverlay(overlay);
  if (!thumbnailPath) {
    console.warn(
      'Cannot create thumbnail for overlay, because thumbnail path is empty:',
      overlay
    );
    return;
  }

  overlay.thumbnail_path = thumbnailPath;
  UserOverlay.update(overlay, ['thumbnail_path']);
}

const instance = new UserOverlayService();
module.exports = instance;