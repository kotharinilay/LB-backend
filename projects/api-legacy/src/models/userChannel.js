const {db, pgp} = require('../services/DatabaseService');

const tableName = new pgp.helpers.TableName({
  table: 'user_channel',
  schema: 'wizardlabs'
});

class UserChannel {
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
    return db.oneOrNone(
      'SELECT * FROM wizardlabs.user_channel WHERE id = $1', [id]
    );
  }

  async getByUserId(userId) {
    return db.any(
      'SELECT * FROM wizardlabs.user_channel WHERE user_id = $1', [userId]
    );
  }

  async countByNameAndUserId(name, userId) {
    return db.one('SELECT COUNT(*) FROM wizardlabs.user_channel ' +
      'WHERE name = $1 AND user_id = $2',
      [name, userId]
    );
  }

  async getByIdAndUserId(id, userId) {
    return db.oneOrNone(
      'SELECT * FROM wizardlabs.user_channel WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
  }

  async countDuplicate(name, externalId, providerType, userId) {
    return db.one(
      'SELECT COUNT(*) FROM wizardlabs.user_channel WHERE user_id = $1 ' +
      'AND (name = $2 OR (external_id = $3 AND provider_type = $4))',
      [userId, name, externalId, providerType]
    );
  }

  async delete(id) {
    return db.none('DELETE FROM wizardlabs.user_channel WHERE id = $1', [id]);
  }

}

const instance = new UserChannel();
module.exports = instance;
