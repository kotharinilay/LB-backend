const {db, pgp} = require('../services/DatabaseService');

const tableName = new pgp.helpers.TableName({
  table: 'social_video_comments',
  schema: 'wizardlabs'
});

class SocialVideoComment {
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
  
  async updateByIdAndUserId(userId,commentId,comment) {
    var sql = ''
    sql = 'UPDATE wizardlabs.social_video_comments ' +
        'SET comment = $1 ' +
        'WHERE ' +
        'id = $2 '+
        'AND comment_user_id = $3 ';

    return db.any(sql, [comment, commentId, userId]);
  }

  async getBySocialVideoId(socialVideoId) {
    var sql = ''
        sql = 'SELECT ' +
            'wizardlabs.social_video_comments.social_video_id, ' +
            'wizardlabs.social_video_comments.id AS social_video_comment_id, ' +
            'wizardlabs.social_video_comments.comment_user_id, ' +
            'wizardlabs.social_video_comments.comment, ' +
            'wizardlabs.social_video_comments.created_date, ' +
            'wizardlabs.user.name, ' +
            'wizardlabs.user.user_name, ' +
            'wizardlabs.user.avatar ' +
        'FROM ' +
            'wizardlabs.social_video_comments ' +
            'LEFT JOIN wizardlabs.user ON (wizardlabs.user.id = wizardlabs.social_video_comments.comment_user_id) ' +
        'WHERE ' +
            'wizardlabs.social_video_comments.social_video_id = $1';

    return db.any(sql, [socialVideoId]);
  }
  
  async getByCommentId(commentId) {
    var sql = ''
        sql = 'SELECT ' +
            'wizardlabs.social_video_comments.social_video_id, ' +
            'wizardlabs.social_video_comments.id AS social_video_comment_id, ' +
            'wizardlabs.social_video_comments.comment_user_id, ' +
            'wizardlabs.social_video_comments.comment, ' +
            'wizardlabs.social_video_comments.created_date, ' +
            'wizardlabs.user.name, ' +
            'wizardlabs.user.user_name, ' +
            'wizardlabs.user.avatar ' +
        'FROM ' +
            'wizardlabs.social_video_comments ' +
            'LEFT JOIN wizardlabs.user ON (wizardlabs.user.id = wizardlabs.social_video_comments.comment_user_id) ' +
        'WHERE ' +
            'wizardlabs.social_video_comments.id = $1';

    return db.one(sql, [commentId]);
  }

  async deleteByUserIdAndSocialVideoCommentId(userId,socialVideoCommentId) {
    return db.none('DELETE FROM wizardlabs.social_video_comments WHERE comment_user_id = $1 AND id = $2', [userId,socialVideoCommentId]);
  }
}

const instance = new SocialVideoComment();
module.exports = instance;
