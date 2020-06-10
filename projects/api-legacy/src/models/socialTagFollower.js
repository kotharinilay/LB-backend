const {db, pgp} = require('../services/DatabaseService');

const tableName = new pgp.helpers.TableName({
  table: 'social_tag_followers',
  schema: 'wizardlabs'
});

class SocialTagFollower {
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

  async getByTagId(tag_id) {
    return db.oneOrNone('SELECT * FROM wizardlabs.social_tag_followers WHERE tag_id = $1', [tag_id]);
  }

  async getByUserId(user_id) {
    return db.oneOrNone(
      'SELECT * FROM wizardlabs.social_tag_followers WHERE user_id = $1', [tag]
    );
  }

  async getByUserIdAndTagId(user_id, tag_id) {
    return db.oneOrNone(
      'SELECT * FROM wizardlabs.social_tag_followers WHERE user_id = $1 AND tag_id = $2', [user_id, tag_id]
    );
  }

  async deleteByTagIdAndUserId(tagId,userId) {
    return db.none('DELETE FROM wizardlabs.social_tag_followers WHERE user_id = $1 AND tag_id = $2', [userId,tagId]);
  }
}

const instance = new SocialTagFollower();
module.exports = instance;
