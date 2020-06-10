const {db, pgp} = require('../services/DatabaseService');

const tableName = new pgp.helpers.TableName({
  table: 'user_password_reset',
  schema: 'wizardlabs'
});

class PasswordReset {
  async create(data) {
    const query = pgp.helpers.insert(data, null, tableName) + ' RETURNING id';
    return db.one(query)
      .then((data) => data.id);
  }

  async getByToken(token) {
    return db.oneOrNone(
      'SELECT * FROM wizardlabs.user_password_reset WHERE token = $1',
      [token]
    );
  }

  async delete(id) {
    return db.none(
      'DELETE FROM wizardlabs.user_password_reset WHERE id = $1', [id]
    );
  }
}

const instance = new PasswordReset();
module.exports = instance;
