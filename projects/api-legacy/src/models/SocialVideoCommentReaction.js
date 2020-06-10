const {db, pgp} = require('../services/DatabaseService');

const tableName = new pgp.helpers.TableName({
  table: 'social_video_comment_reactions',
  schema: 'wizardlabs'
});

class SocialVideoCommentReaction {
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

  async getByVideoCommentId(social_video_comment_id) {
    return db.oneOrNone('SELECT * FROM wizardlabs.social_video_comment_reactions WHERE social_video_comment_id = $1', [social_video_comment_id]);
  }
}

const instance = new SocialVideoCommentReaction();
module.exports = instance;
