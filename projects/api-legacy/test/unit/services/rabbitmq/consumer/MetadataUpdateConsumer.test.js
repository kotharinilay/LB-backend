const {expect} = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const sinon = require('sinon');
const MalformedRabbitMessageError = require('../../../../../errors/MalformedRabbitMessageError');

let dbEntryMock = {
  id: 1115,
  metadata: {size: 584605}
};

const UserClipMetadataModelStub = {
  getByClipId: sinon.stub().resolves(dbEntryMock),
  create: sinon.stub(),
  update: sinon.stub().resolves()
};
const RabbitConsumerStub = class {
  connect() {}
};
const {
  processMetadataEntry,
  isMetadataEntryValid
} = proxyquire('../../../../../services/rabbitmq/MetadataUpdateConsumer', {
  '../../models/userClipMetadata': UserClipMetadataModelStub,
  './consumer/RabbitConsumer': RabbitConsumerStub
});

describe('MetadataUpdateConsumer', async () => {
  describe('#isMetadataValid', async () => {
    it('returns false when no id is passed', () => {
      const cases = [
        {
          clip_id: 1, // Incorrect key name
          metadata: {}
        },
        {
          metadata: {} // No key passed
        },
        {
          id: null, // Field present, no value
          metadata: {}
        },
        {
          id: 'BAD STRING', // Shouldn't accept strings
          metadata: {}
        },
        {
          id: 1,
          metadata: [] // Incorrect metadata type
        },
        {
          id: 1,
          metadata: 10 // Incorrect metadata type
        },
      ];

      cases.forEach((testCase) => {
        expect(isMetadataEntryValid(testCase)).to.not.be.true;
      });
    });

    it('returns true with valid entries', () => {
      const cases = [
        {
          id: 1,
          metadata: {}
        },
        {
          id: 2,
          metadata: {}
        },
        {
          id: 9,
          metadata: null
        },
        {
          id: '5',
          metadata: {
            comment: 'We should expect numbers, even as strings'
          }
        }
      ];

      cases.forEach((testCase) => {
        expect(isMetadataEntryValid(testCase));
      });

    });
  });

  describe('#processMetadataEntry', async () => {
    beforeEach(() => {
      UserClipMetadataModelStub.getByClipId.resetHistory();
      UserClipMetadataModelStub.update.resetHistory();
      UserClipMetadataModelStub.create.resetHistory();
    });

    it(`throws a MalformedRabbitMessageError() on bad messages`, async () => {
      const cases = [
        {},
        {id: 1}, // missing metadata
        {metadata: {}}, // missing key
        {randomKey: 'hi'}, // missing both
        {id: 1, metadata: ['hi']}, // metadata is an array not object
        {id: 1, metadata: 'hi'} // metadata is a string not object
      ];

      cases.forEach((payload) => {
        processMetadataEntry(payload)
          .then((_) => expect.fail('Invalid payload accepted'))
          .catch((err) => expect(err instanceof MalformedRabbitMessageError));
      });
    });

    it(`ignores extra fields in payload and updates existing metadata`, async () => {
      const input = {
        id: 1,
        metadata: {
          height: 30
        },
        otherKey: 'hi'
      };

      try {
        await processMetadataEntry(input);
        expect(UserClipMetadataModelStub.getByClipId.calledWith(1));
        expect(UserClipMetadataModelStub.update.calledWith(input, ['metadata']));
        expect(UserClipMetadataModelStub.create.called).to.be.not.true;
      } catch (err) {
        expect.fail('No error should be thrown for extra keys');
      }
    });

    it(`calls 'create()' when no entry exists yet`, async () => {
      const EmptyUserClipMetadataModelStub = {
        getByClipId: sinon.stub().resolves(null),
        create: sinon.stub(),
        update: sinon.stub().resolves()
      };
      const {processMetadataEntry: mockProcessMetadataEntry} = proxyquire(
        '../../../../../services/rabbitmq/MetadataUpdateConsumer',
        {
          '../../models/userClipMetadata': EmptyUserClipMetadataModelStub,
          './consumer/RabbitConsumer': RabbitConsumerStub
        }
      );

      const input = {
        id: 1,
        metadata: {
          height: 30,
          killDistance: 509
        }
      };

      await mockProcessMetadataEntry(input);
      expect(EmptyUserClipMetadataModelStub.getByClipId.calledWith(1));
      expect(
        EmptyUserClipMetadataModelStub.create.calledWith(
          sinon.match({
            id: 1,
            metadata: {
              height: 30,
              killDistance: 509
            }
          })
        )
      );
      expect(EmptyUserClipMetadataModelStub.update.callCount).to.equal(0);
    });
  });

});