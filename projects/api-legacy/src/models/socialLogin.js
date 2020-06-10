const {db, pgp} = require('../services/DatabaseService');

const tableName = new pgp.helpers.TableName({
  table: 'social_login',
  schema: 'wizardlabs'
});

class SocialLogin {
  async create(data) {
    const query = pgp.helpers.insert(data, null, tableName) + ' RETURNING id';
    return db.one(query)
      .then((data) => data.id);
  }

  async getByToken(token) {
    return db.oneOrNone('SELECT * FROM wizardlabs.social_login WHERE token = $1', [token]);
  }

  async delete(id) {
    return db.none('DELETE FROM wizardlabs.social_login WHERE id = $1', [id]);
  }
}

const instance = new SocialLogin();
module.exports = instance;
