const {db, pgp} = require('../services/DatabaseService');

const tableName = new pgp.helpers.TableName({
  table: 'social_user_followers',
  schema: 'wizardlabs'
});

class SocialUserFollower {
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

  async getByUserId(userId) {
    var sql = ''
    sql = 'SELECT ' +
        'wizardlabs.user.id AS user_id, ' +
        'wizardlabs.user.name, ' +
        'wizardlabs.user.user_name, ' +
        'wizardlabs.user.avatar ' +
    'FROM ' +
        'wizardlabs.social_user_followers ' +
        'LEFT JOIN wizardlabs.user ON (wizardlabs.social_user_followers.followed_by_user_id = wizardlabs.user.id) ' +
    'WHERE ' +
        'wizardlabs.social_user_followers.user_id=$1 ';
    
    return db.any(sql, [userId]);
  }

  async getByFollowedByUserId(followedByUserId) {
    return db.any(
      'SELECT * FROM wizardlabs.social_user_followers WHERE followed_by_user_id = $1', [followedByUserId]
    );
  }

  async deleteByUserIDAndFollowedByUserId(userId,followedByUserId) {
    return db.none('DELETE FROM wizardlabs.social_user_followers WHERE user_id = $1 AND followed_by_user_id = $2', [userId,followedByUserId]);
  }
}

const instance = new SocialUserFollower();
module.exports = instance;
