const expect = require('chai').expect;
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

let sut;

describe('AESEncryptionService', () => {
  beforeEach(() => {
    sandbox.stub(process, 'env').value({
      AES_ENCRYPTION_KEY: '1234567890123456'
    });
    sut = require('../../../services/AESEncryptionService');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('encrypt', () => {
    // given
    const data = '{"userId": 1}';
    const expected = '95fb5dd717f094b5d18b36e4c2';
    // when
    const result = sut.encrypt(data);
    // then
    expect(result).to.equal(expected);
  });

  it('decrypt', () => {
    // given
    const expected = '{"userId": 2}';
    const encrypted = sut.encrypt(expected);
    // when
    const result = sut.decrypt(encrypted);
    // then
    expect(result).to.equal(expected);
  });
});
