const util = require('util');
const AWS = require('aws-sdk');

const BadGatewayError = require('../../errors/BadGatewayError');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_CREDENTIALS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_CREDENTIALS_SECRET_KEY,
  region: process.env.AWS_S3_REGION
});

class S3StorageService {
  async generateSignedUrl(bucket, path, urlExpirationTime) {
    const params = {
      Bucket: bucket,
      Key: path,
      Expires: urlExpirationTime,
      ACL: 'public-read'
    };
    let result;

    try {
      const promisified = util.promisify(s3.getSignedUrl).bind(s3);
      result = await promisified('putObject', params);
    } catch (error) {
      console.error('Cannot generate signed URL to upload video:', error);
      throw new BadGatewayError('Cannot create signed URL');
    }

    return result;
  }

  async getFileMetadata(bucket, path) {
    const params = {
      Bucket: bucket,
      Key: path
    };
    let result;

    try {
      const promisified = util.promisify(s3.headObject).bind(s3);
      result = await promisified(params);
    } catch (error) {
      console.error(
        `Cannot get object data in S3 by path '${bucket}':'${path}':`,
        error
      );
      throw new BadGatewayError('Cannot get object data in file storage');
    }

    return result;
  }

  async uploadFile(bucket, path, mimeType, body) {
    const params = {
      Bucket: bucket,
      Key: path,
      Body: body,
      ContentType: mimeType,
      ACL: 'public-read'
    };

    try {
      const promisified = util.promisify(s3.upload).bind(s3);
      await promisified(params);
    } catch (error) {
      console.error(
        `Cannot upload file to S3 by path '${bucket}':'${path}':`,
        error
      );
      throw new BadGatewayError('Cannot upload file in file storage');
    }
  }

  async deleteFile(bucket, path) {
    const params = {
      Bucket: bucket,
      Key: path
    };

    try {
      const promisified = util.promisify(s3.deleteObject).bind(s3);
      await promisified(params);
    } catch (error) {
      console.error(
        `Cannot delete file from S3 by path '${bucket}':'${path}':`,
        error
      );
      throw new BadGatewayError('Cannot delete file in file storage');
    }
  }
}

const instance = new S3StorageService();
module.exports = instance;
