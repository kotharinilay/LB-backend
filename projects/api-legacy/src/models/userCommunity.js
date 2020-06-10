const {db, pgp} = require('../services/DatabaseService');

const tableName = new pgp.helpers.TableName({
  table: 'user_community',
  schema: 'wizardlabs'
});

class UserCommunity {
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
      'SELECT * FROM wizardlabs.user_community WHERE id = $1', [id]
    );
  }

  /**
   * Gets all communities for user
   * @param {number} userId - User Id
   * @returns {Promise<*|XPromise<any[]>>} Array of communities
   */
  async getAllByUserId(userId) {
    return db.any(
      'SELECT UC.* FROM user_community as UC ' +
      '  INNER JOIN user_community_member AS UCM ' +
      '  ON UC.id = UCM.community_id ' +
      'WHERE UCM.user_id = $1 ' +
      '  ORDER BY UC.id DESC',
      [userId]
    );
  }

  /**
   * Gets community by Id and owner user Id
   * @param {number} id - Community Id
   * @param {number} userId - Owner user Id
   * @returns {Promise<XPromise<any | null>>} Promise that contain community
   */
  async getByIdAndOwnerId(id, userId) {
    return db.oneOrNone(
      'SELECT * FROM wizardlabs.user_community WHERE id = $1 AND owner_id = $2',
      [id, userId]
    );
  }

  /**
   * Get information on a community that the user's {userId} should belong
   * to. If nothing is returned, then the community has no content or the
   * user does not belong to the community.
   * 
   * Note: I didn't want to make this two separate queries for now since we
   * are 'whitegloving' the initial communities.
   * @param {number} userId Number representing the unique user id
   * @param {number} communityId Number representing the unique community id
   */
  async getByIdAndUserId(userId, communityId) {
    // TODO: turn this into a task where task 1 pulls the communityId
    // from the userId, and uses userId for the rest so we can return
    // better errors and differentiate between not being a member of
    // the community vs. the community not existing (this is less likely)
    // to happen.
    return db.oneOrNone(
      'SELECT UC.* ' +
      'FROM user_community as UC ' +
      '  INNER JOIN user_community_member AS UCM ' +
      '    ON UC.id = UCM.community_id ' +
      'WHERE UCM.user_id = $1 ' +
      'AND UC.id = $2',
      [userId, communityId]
    );
  }

  /**
   * Gets count of common communities between 2 users
   * @param userId1 - User 1 Id
   * @param userId2 - User 2 Id
   * @returns {Promise<*|XPromise<any>>} Count of communities
   */
  async getCountOfCommonCommunities(userId1, userId2) {
    return db.one(
      'SELECT COUNT(*) FROM wizardlabs.user_community_member ucm1 ' +
      ' INNER JOIN wizardlabs.user_community_member ucm2 ' +
      '   ON ucm1.community_id = ucm2.community_id AND ucm2.user_id = $1 ' +
      'WHERE ucm1.user_id = $2',
      [userId1, userId2]
    );
  }

  /**
   * Gets a list of all the streamers that belong to a particular community
   * @param userId - User Id
   * @param communityId - Community Id
   * @returns {Promise<*|XPromise<any>>} Promise that contains an array of streamers
   */
  async getStreamersByCommunityId(userId,communityId) {

    return db.any(
        'SELECT DISTINCT uc.streamer_name ' +
        'FROM wizardlabs.user_community_member ucm ' +
        'LEFT JOIN wizardlabs.user_clip uc ON uc.user_id = ucm.user_id ' +
        'WHERE ' +
        '    uc.streamer_name IS NOT NULL AND ' +
        '    uc.status != \'DELETED\' AND ' +
        '    ucm.community_id = $1 AND ' +
        'uc.user_id IN ' +
        ' (' +
        '  SELECT DISTINCT ' +
        '   ucm2.user_id FROM wizardlabs.user_community_member ucm1 ' +
        '   INNER JOIN ' +
        '      wizardlabs.user_community_member ucm2 ' +
        '      ON ucm1.community_id = ucm2.community_id ' +
        '      AND ucm2.user_id != $2 ' +
        '  WHERE ' +
        '   ucm1.user_id = $2 ' +
        ' ) ' +
        'ORDER BY uc.streamer_name ASC ',
        [communityId,userId]
    );
  }
}

const instance = new UserCommunity();
module.exports = instance;
