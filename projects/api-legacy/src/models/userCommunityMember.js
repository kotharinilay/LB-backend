const {db, pgp} = require('../services/DatabaseService');

const tableName = new pgp.helpers.TableName({
  table: 'user_community_member',
  schema: 'wizardlabs'
});

class UserCommunityMember {
  async create(data) {
    const query = pgp.helpers.insert(data, null, tableName) + ' ON CONFLICT DO NOTHING RETURNING id';
    return db.any(query)
      .then((data) => data.id);
  }

  async update(data, columns) {
    const condition = pgp.as.format(' WHERE id = ${id}', data);
    const query = pgp.helpers.update(data, columns, tableName) + condition;

    return db.none(query);
  }

  async getById(id) {
    return db.oneOrNone(
      'SELECT * FROM wizardlabs.user_community_member WHERE id = $1', [id]
    );
  }

  /**
   * Check if user is member of community
   * @param userId - User Id
   * @param communityId - Community Id
   * @returns {Promise<*|XPromise<any>>} True if member, otherwise - false
   */
  async existsByUserIdAndCommunityId(userId, communityId) {
    return db.one(
      'SELECT EXISTS ' +
      '  (SELECT 1 FROM wizardlabs.user_community_member ' +
      '    WHERE user_id = $1 AND community_id = $2 ' +
      '  )',
      [userId, communityId]
    );
  }

  async getByCommunityId(id) {
    return db.oneOrNone(
      'SELECT * FROM wizardlabs.user_community_member WHERE community_id = $1', [id]
    );
  }

  async getMemberCountsOfCommunitiesByIds(ids) {
    return db.any(
      'SELECT COUNT(*) FROM wizardlabs.user_community_member WHERE community_id IN ($1:csv)',
      [ids]
    );
  }
}

const instance = new UserCommunityMember();
module.exports = instance;
