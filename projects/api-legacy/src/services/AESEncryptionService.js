const aesjs = require('aes-js');
const key = convertStringToNumberArray(process.env.AES_ENCRYPTION_KEY);

class AESEncryptionService {
  encrypt(data) {
    const textBytes = aesjs.utils.utf8.toBytes(data);
    const aesCtr = new aesjs.ModeOfOperation.ctr(key);
    const encryptedBytes = aesCtr.encrypt(textBytes);

    return aesjs.utils.hex.fromBytes(encryptedBytes);
  }

  decrypt(encryptedData) {
    const encryptedBytes = aesjs.utils.hex.toBytes(encryptedData);
    const aesCtr = new aesjs.ModeOfOperation.ctr(key);
    const decryptedBytes = aesCtr.decrypt(encryptedBytes);

    return aesjs.utils.utf8.fromBytes(decryptedBytes);
  }
}

function convertStringToNumberArray(data) {
  return data.split('')
    .map((character) => +character);
}

const instance = new AESEncryptionService();
module.exports = instance;
