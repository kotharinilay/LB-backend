const BadRequestError = require('../../errors/BadRequestError');

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg'];
const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg'];
const MAX_FILE_SIZE = 1 * 1024 * 1024;

class FileUploadValidator {
  validateFile(fileData) {
    const name = fileData.originalname;
    const extension = getFileExtension(name);
    const mimeType = fileData.mimetype;
    const size = fileData.size;

    if (!ALLOWED_EXTENSIONS.includes(extension.toLowerCase())) {
      console.error('File extension is not allowed:', extension);
      throw new BadRequestError('File extension is not allowed');
    }

    if (!ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
      console.error('Mime type is not allowed:', mimeType);
      throw new BadRequestError('File mimetype is not allowed');
    }

    if (size > MAX_FILE_SIZE || fileData.truncated) {
      console.error(
        `File is too big: ${size}, truncated: ${fileData.truncated}`
      );
      throw new BadRequestError('File too big');
    }
  }
}

function getFileExtension(fileName) {
  return fileName.slice((fileName.lastIndexOf('.') - 1 >>> 0) + 2);
}

const instance = new FileUploadValidator();
module.exports = instance;
