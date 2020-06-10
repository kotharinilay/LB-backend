const {db, pgp} = require('../services/DatabaseService');

const tableName = new pgp.helpers.TableName({
  table: 'user',
  schema: 'wizardlabs'
});

class User {
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

  async getById(id) {
    return db.oneOrNone('SELECT * FROM wizardlabs.user WHERE id = $1', [id]);
  }

  async getByEmail(email) {
    return db.oneOrNone(
      'SELECT * FROM wizardlabs.user WHERE email = $1', [email]
    );
  }
  
  async getBySocialId(socialId, socialPlatform) {
    return db.oneOrNone(
      'SELECT * FROM wizardlabs.user WHERE socialId = $1 and socialPlatform = $2', [socialId, socialPlatform]
    );
  }
}

const instance = new User();
module.exports = instance;
