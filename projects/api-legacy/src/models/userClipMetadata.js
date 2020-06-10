const {db, pgp} = require('../services/DatabaseService');

const tableName = new pgp.helpers.TableName({
  table: 'user_clip_metadata',
  schema: 'wizardlabs'
});

class UserClipMetadata {
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

  async getByClipId(clipId) {
    return db.oneOrNone(
      'SELECT * FROM wizardlabs.user_clip_metadata WHERE clip_id = $1',
      [clipId]
    );
  }

  async deleteByClipId(clipId) {
    return db.none(
      'DELETE FROM wizardlabs.user_clip_metadata WHERE clip_id = $1',
      [clipId]
    );
  }
}

const instance = new UserClipMetadata();
module.exports = instance;
