const {db, pgp} = require('../services/DatabaseService');

const UserAccountStatusEnum = require('../common/enums/UserAccountStatusEnum');

const tableName = new pgp.helpers.TableName({
  table: 'user_account',
  schema: 'wizardlabs'
});

class UserAccount {
  async create(data) {
    const query = pgp.helpers.insert(data, null, tableName) + ' RETURNING id';
    return db.one(query)
      .then((data) => data.id);
  }

  async update(data, columns) {
    const condition = pgp.as.format(' WHERE id = ${id}', data);
    const query = pgp.helpers.update(data, columns, tableName) + condition;

    return db.none(query);
  }

  async getByUserId(userId) {
    return db.any(
      'SELECT * FROM wizardlabs.user_account ' +
      'WHERE user_id = $1 ' +
      ' AND status = $2',
      [userId, UserAccountStatusEnum.active]
    );
  }

  async getByUserIdAndProviderType(userId, providerType) {
    return db.oneOrNone(
      'SELECT * FROM wizardlabs.user_account ' +
      'WHERE user_id = $1 AND provider_type = $2 ' +
      ' AND status = $3',
      [userId, providerType, UserAccountStatusEnum.active]
    );
  }

  async getByProviderTypeAndSocialId(providerType, socialId) {
    return db.oneOrNone(
      'SELECT * FROM wizardlabs.user_account ' +
      'WHERE provider_type = $1 AND user_data ->> \'id\' = $2 ' +
      ' AND status = $3',
      [providerType, socialId, UserAccountStatusEnum.active]
    );
  }
}

const instance = new UserAccount();
module.exports = instance;
