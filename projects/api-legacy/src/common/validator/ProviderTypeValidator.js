const BadRequestError = require('../../errors/BadRequestError');
const ProvidersEnum = require('../enums/ProvidersEnum');

class ProviderTypeValidator {
  validate(providerType) {
    if (!ProvidersEnum.hasValue(providerType)) {
      console.error('Unknown provider type:', providerType);
      throw new BadRequestError('Provider is not supported');
    }
  }
}

const instance = new ProviderTypeValidator();
module.exports = instance;
