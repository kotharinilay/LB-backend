const {db, pgp} = require('../services/DatabaseService');

const tableName = new pgp.helpers.TableName({
  table: 'social_video_tags',
  schema: 'wizardlabs'
});

class SocialVideoTag {
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

  async getBySocialVideoId(social_video_id) {
    return db.oneOrNone('SELECT * FROM wizardlabs.social_video_tags WHERE social_video_id = $1', [social_video_id]);
  }
}

const instance = new SocialVideoTag();
module.exports = instance;
