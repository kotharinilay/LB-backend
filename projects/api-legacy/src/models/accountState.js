const {db, pgp} = require('../services/DatabaseService');

const tableName = new pgp.helpers.TableName({
  table: 'user_account_state',
  schema: 'wizardlabs'
});

class AccountState {
  async create(data) {
    const query = pgp.helpers.insert(data, null, tableName) + ' RETURNING id';
    return db.one(query)
      .then((data) => data.id);
  }

  async getByToken(token) {
    return db.oneOrNone('SELECT * FROM wizardlabs.user_account_state WHERE token = $1', [token]);
  }

  async deleteByUserIdAndProviderType(userId, providerType) {
    return db.none('DELETE FROM wizardlabs.user_account_state WHERE user_id = $1 AND provider_type = $2', [userId, providerType]);
  }

  async delete(id) {
    return db.none('DELETE FROM wizardlabs.user_account_state WHERE id = $1', [id]);
  }
}

const instance = new AccountState();
module.exports = instance;
