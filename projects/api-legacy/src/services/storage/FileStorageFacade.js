const mime = require('mime-types');

const S3StorageService = require('./S3StorageService');
const ClipTypeEnum = require('../../common/enums/ClipTypeEnum');

const SIGNED_URL_EXPIRATION_TIME_SECONDS = parseInt(
  process.env.AWS_S3_SIGNED_URL_EXPIRATION_TIME_SECONDS, 10
);
const AWS_S3_USER_DATA_BUCKET_NAME = process.env.AWS_S3_USER_DATA_BUCKET_NAME;
const AWS_S3_USER_VIDEO_BUCKET_NAME = process.env.AWS_S3_USER_VIDEO_BUCKET_NAME;
const AWS_S3_AUTO_CLIP_BUCKET_NAME = process.env.AWS_S3_AUTO_CLIP_BUCKET_NAME;
const AWS_S3_YOUTUBE_MP3_BUCKET = process.env.AWS_S3_YOUTUBE_MP3_BUCKET;
const AWS_S3_USER_DATA_REGION = 'us-east-2';
const AWS_S3_VIDEO_REGION = 'us-west-2';
const USER_AVATAR_FOLDER_PATH = 'user/avatar';
const USER_BACKGROUND_FOLDER_PATH = 'user/background';
const VIDEO_OVERLAY_FOLDER_PATH = 'overlay';
const VIDEO_BUMPER_FOLDER_PATH = 'bumper';
const VIDEO_FOLDER_PATH = 'video';
const MANUAL_CLIP_FOLDER_PATH = 'clip';

class FileStorageFacade {
  async uploadUserAvatar(fileName, data) {
    const fileExtension = getFileExtension(fileName);
    const mimeType = mime.lookup(fileExtension);
    const filePath = buildUserAvatarFilePath(fileExtension);

    await S3StorageService.uploadFile(
      AWS_S3_USER_DATA_BUCKET_NAME, filePath, mimeType, data
    );

    return {
      url: buildUserDataFileUrl(filePath),
      path: filePath
    };
  }

  async deleteUserAvatar(path) {
    return S3StorageService.deleteFile(AWS_S3_USER_DATA_BUCKET_NAME, path);
  }

  async uploadUserBackground(fileName, data) {
    const fileExtension = getFileExtension(fileName);
    const mimeType = mime.lookup(fileExtension);
    const filePath = buildUserBackgroundFilePath(fileExtension);

    await S3StorageService.uploadFile(
      AWS_S3_USER_DATA_BUCKET_NAME, filePath, mimeType, data
    );

    return {
      url: buildUserDataFileUrl(filePath),
      path: filePath
    };
  }

  async deleteUserBackground(path) {
    return S3StorageService.deleteFile(AWS_S3_USER_DATA_BUCKET_NAME, path);
  }

  async uploadVideoOverlay(fileName, data) {
    const fileExtension = getFileExtension(fileName);
    const mimeType = mime.lookup(fileExtension);
    const filePath = buildVideoOverlayFilePath(fileExtension);

    await S3StorageService.uploadFile(
      AWS_S3_USER_VIDEO_BUCKET_NAME, filePath, mimeType, data
    );

    return {
      url: buildVideoFileUrl(filePath),
      path: filePath
    };
  }
  
  async uploadMp3(filePath, data) {
    const fileExtension = getFileExtension(filePath);
    const mimeType = mime.lookup(fileExtension);

    await S3StorageService.uploadFile(
      AWS_S3_YOUTUBE_MP3_BUCKET, filePath, mimeType, data
    );

    return {
      url: buildMP3FileUrl(filePath)
    };
  }

  async deleteVideoOverlay(path) {
    return S3StorageService.deleteFile(AWS_S3_USER_VIDEO_BUCKET_NAME, path);
  }

  buildVideoOverlayUrl(path) {
    return `https://${AWS_S3_USER_VIDEO_BUCKET_NAME}.s3-${AWS_S3_VIDEO_REGION}` +
      `.amazonaws.com/${path}`;
  }

  async getSignedUrlForVideo(fileExtension) {
    const filePath = buildVideoFilePath(fileExtension);
    const url = await S3StorageService.generateSignedUrl(
      AWS_S3_USER_VIDEO_BUCKET_NAME, filePath, SIGNED_URL_EXPIRATION_TIME_SECONDS
    );

    return {
      url: url,
      path: filePath
    }
  }

  async getVideoFileMetadata(path) {
    return S3StorageService.getFileMetadata(
      AWS_S3_USER_VIDEO_BUCKET_NAME,
      path
    );
  }

  async deleteClipThumbnail(clipType, path) {
    return S3StorageService.deleteFile(
      getClipBucket(clipType), path
    );
  }

  async deleteClip(type, path) {
    return S3StorageService.deleteFile(getClipBucket(type), path);
  }

  buildVideoUrl(path) {
    return `https://${AWS_S3_USER_VIDEO_BUCKET_NAME}.s3-${AWS_S3_VIDEO_REGION}` +
      `.amazonaws.com/${path}`;
  }

  async getSignedUrlForClip(fileExtension, channelId) {
    const filePath = buildClipFilePath(fileExtension, channelId);
    const url = await S3StorageService.generateSignedUrl(
      AWS_S3_USER_VIDEO_BUCKET_NAME, filePath, SIGNED_URL_EXPIRATION_TIME_SECONDS
    );

    return {
      url: url,
      path: filePath
    }
  }

  async getClipFileMetadata(path, type) {
    return S3StorageService.getFileMetadata(getClipBucket(type), path);
  }

  buildManualClipUrl(path) {
    return `https://${AWS_S3_USER_VIDEO_BUCKET_NAME}.s3-${AWS_S3_VIDEO_REGION}` +
      `.amazonaws.com/${path}`;
  }

  async getSignedUrlForVideoBumper(fileExtension) {
    const filePath = buildVideoBumperFilePath(fileExtension);
    const url = await S3StorageService.generateSignedUrl(
      AWS_S3_USER_VIDEO_BUCKET_NAME, filePath, SIGNED_URL_EXPIRATION_TIME_SECONDS
    );

    return {
      url: url,
      path: filePath
    }
  }

  async getBumperFileMetadata(path) {
    return S3StorageService.getFileMetadata(AWS_S3_USER_VIDEO_BUCKET_NAME, path);
  }
}

function buildUserAvatarFilePath(fileExtension) {
  const fileName = generateFileName();
  return `${USER_AVATAR_FOLDER_PATH}/${fileName}.${fileExtension}`;
}

function buildUserBackgroundFilePath(fileExtension) {
  const fileName = generateFileName();
  return `${USER_BACKGROUND_FOLDER_PATH}/${fileName}.${fileExtension}`;
}

function buildVideoOverlayFilePath(fileExtension) {
  const fileName = generateFileName();
  return `${VIDEO_OVERLAY_FOLDER_PATH}/${fileName}.${fileExtension}`;
}

function buildVideoFilePath(fileExtension) {
  const fileName = generateFileName();
  return `${VIDEO_FOLDER_PATH}/${fileName}.${fileExtension}`;
}

function buildClipFilePath(fileExtension, channelId) {
  const fileName = generateFileName();
  return `${MANUAL_CLIP_FOLDER_PATH}/${fileName}.${fileExtension}`;
}

function buildUserDataFileUrl(path) {
  return `https://${AWS_S3_USER_DATA_BUCKET_NAME}.s3-${AWS_S3_USER_DATA_REGION}.amazonaws.com/${path}`;
}

function buildVideoFileUrl(path) {
  return `https://${AWS_S3_USER_VIDEO_BUCKET_NAME}.s3-${AWS_S3_VIDEO_REGION}.amazonaws.com/${path}`;
}

function buildMP3FileUrl(path) {
  return `https://${AWS_S3_YOUTUBE_MP3_BUCKET}.s3-${AWS_S3_VIDEO_REGION}.amazonaws.com/${path}`;
}

function buildVideoBumperFilePath(fileExtension) {
  const fileName = generateFileName();
  return `${VIDEO_BUMPER_FOLDER_PATH}/${fileName}.${fileExtension}`;
}

function getFileExtension(fileName) {
  return fileName.slice((fileName.lastIndexOf('.') - 1 >>> 0) + 2);
}

function generateFileName() {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}

function getClipBucket(type) {
  return type === ClipTypeEnum.manual ?
    AWS_S3_USER_VIDEO_BUCKET_NAME :
    AWS_S3_AUTO_CLIP_BUCKET_NAME;
}

const instance = new FileStorageFacade();
module.exports = instance;
