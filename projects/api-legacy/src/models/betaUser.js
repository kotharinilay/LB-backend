const {db, pgp} = require('../services/DatabaseService');

const tableName = new pgp.helpers.TableName({
  table: 'beta_user',
  schema: 'wizardlabs'
});

class BetaUser {
  async create(data) {
    const query = pgp.helpers.insert(data, null, tableName) + ' RETURNING id';
    return db.one(query)
      .then((data) => data.id);
  }

  async getByEmail(email) {
    return db.oneOrNone(
      'SELECT * FROM wizardlabs.beta_user WHERE email = $1', [email]
    );
  }
}

const instance = new BetaUser();
module.exports = instance;
