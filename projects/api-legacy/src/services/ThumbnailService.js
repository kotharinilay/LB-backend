const axios = require('axios');

const ThumbnailCreationStrategyEnum = require('../common/enums/ThumbnailCreationStrategyEnum');
const ThumbnailSourceTypeEnum = require('../common/enums/ThumbnailSourceTypeEnum');

const THUMBNAIL_ENGINE_URL = 'http://prod-1505702289.us-west-2.elb.amazonaws.com/api/v1/thumbnails';
const VIDEO_FOLDER_PATH = 'video';
const MANUAL_CLIP_FOLDER_PATH = 'clip';
const VIDEO_BUMPER_FOLDER_PATH = 'bumper';
const VIDEO_OVERLAY_FOLDER_PATH = 'overlay';

class ThumbnailService {
  async createForClip(channelId, clip) {
    const thumbnailPath = MANUAL_CLIP_FOLDER_PATH + '/thumbnail/' + generateFileName() + '.jpg';
    const requestBody = {
      sourceType: ThumbnailSourceTypeEnum.video,
      sourceId: clip.id,
      source: clip.url,
      targetPath: thumbnailPath,
      callbackUrlPath: `/profiles/channels/${channelId}/clips/${clip.id}/thumbnails`,
      strategy: {
        type: ThumbnailCreationStrategyEnum.halfSize
      }
    };

    return axios.post(THUMBNAIL_ENGINE_URL, requestBody)
      .then((response) => {
        console.info('Successfully create thumbnail task for clip:', clip.id);
        return thumbnailPath;
      })
      .catch((error) => {
        console.error(
          'Cannot send request to video engine API for thumbnails:', error
        );
      });
  }

  async createForVideo(video) {
    const thumbnailPath = VIDEO_FOLDER_PATH + '/thumbnail/' + generateFileName() + '.jpg';
    const requestBody = {
      sourceType: ThumbnailSourceTypeEnum.video,
      sourceId: video.id,
      source: video.url,
      targetPath: thumbnailPath,
      callbackUrlPath: `/profiles/videos/${video.id}/thumbnails`,
      strategy: {
        type: ThumbnailCreationStrategyEnum.halfSize
      }
    };

    return axios.post(THUMBNAIL_ENGINE_URL, requestBody)
      .then((response) => {
        console.info('Successfully create thumbnail task for video:', video.id);
        return thumbnailPath;
      })
      .catch((error) => {
        console.error(
          'Cannot send request to video engine API for thumbnails:', error
        );
      });
  }

  async createForBumper(bumper) {
    const thumbnailPath = VIDEO_BUMPER_FOLDER_PATH + '/thumbnail/' + generateFileName() + '.jpg';
    const requestBody = {
      sourceType: ThumbnailSourceTypeEnum.video,
      sourceId: bumper.id,
      source: bumper.url,
      targetPath: thumbnailPath,
      callbackUrlPath: `/profiles/videos/bumpers/${bumper.id}/thumbnails`,
      strategy: {
        type: ThumbnailCreationStrategyEnum.halfSize
      }
    };

    return axios.post(THUMBNAIL_ENGINE_URL, requestBody)
      .then((response) => {
        console.info('Successfully create thumbnail task for bumper:', bumper.id);
        return thumbnailPath;
      }).catch((error) => {
        console.error(
          'Cannot send request to video engine API for thumbnails:', error
        );
      });
  }

  async createForOverlay(overlay) {
    const fileExtension = getFileExtension(overlay.path);
    const thumbnailPath = VIDEO_OVERLAY_FOLDER_PATH + '/thumbnail/'
      + generateFileName() + '.' + fileExtension;
    const requestBody = {
      sourceType: ThumbnailSourceTypeEnum.image,
      sourceId: overlay.id,
      source: overlay.url,
      targetPath: thumbnailPath,
      callbackUrlPath: `/profiles/videos/overlays/${overlay.id}/thumbnails`,
      strategy: {
        type: ThumbnailCreationStrategyEnum.maxDimensions,
        width: 200,
        height: 200
      }
    };

    return axios.post(THUMBNAIL_ENGINE_URL, requestBody)
      .then((response) => {
        console.info('Successfully create thumbnail task for overlay:', overlay.id);
        return thumbnailPath;
      })
      .catch((error) => {
        console.error(
          'Cannot send request to video engine API for thumbnails:', error
        );
      });
  }
}

function generateFileName() {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}

function getFileExtension(fileName) {
  return fileName.slice((fileName.lastIndexOf('.') - 1 >>> 0) + 2);
}

const instance = new ThumbnailService();
module.exports = instance;