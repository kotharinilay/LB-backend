const {db, pgp} = require('../services/DatabaseService');

const tableName = new pgp.helpers.TableName({
  table: 'user_community_invite',
  schema: 'wizardlabs'
});

class UserCommunityInvite {
  async create(data) {
    const query = pgp.helpers.insert(data, null, tableName) + ' RETURNING id';
    return db.one(query)
      .then((data) => data.id);
  }

  async getByToken(token) {
    return db.oneOrNone(
      'SELECT * FROM wizardlabs.user_community_invite WHERE token = $1',
      [token]
    );
  }

  async getByCommunityId(communityId) {
    return db.oneOrNone(
      'SELECT * FROM wizardlabs.user_community_invite WHERE community_id = $1',
      [communityId]
    );
  }

  async delete(id) {
    return db.none(
      'DELETE FROM wizardlabs.user_community_invite WHERE id = $1', [id]
    );
  }
}

const instance = new UserCommunityInvite();
module.exports = instance;
