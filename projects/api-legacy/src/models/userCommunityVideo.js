const {db, pgp} = require('../services/DatabaseService');

const {applySortAndGroup, applyPagination} = require('../common/PagingSorting');
const SortOrderEnum = require('../common/enums/SortOrderEnum');
const VideoStatusEnum = require('../common/enums/VideoStatusEnum');

const tableName = new pgp.helpers.TableName({
  table: 'user_community_video',
  schema: 'wizardlabs'
});

const DEFAULT_PAGING_LIMIT = process.env.DEFAULT_PAGING_LIMIT || 20;

class UserCommunityVideo {
  async create(data) {
    const query = pgp.helpers.insert(data, null, tableName) + ' RETURNING id';
    return db.one(query).then((data) => data.id);
  }

  async update(data, columns) {
    const condition = pgp.as.format(' WHERE id = ${id}', data);
    const query = pgp.helpers.update(data, columns, tableName) + condition;

    return db.none(query);
  }

  async getById(id) {
    return db.oneOrNone(
    'SELECT ucv.* FROM wizardlabs.user_community_video ucv ' +
    'INNER JOIN wizardlabs.user_video uv ' +
    '  ON ucv.video_id = uv.id ' +
    '  WHERE uv.status != $1 ' +
    '  AND ucv.id = $2 ',
      [VideoStatusEnum.deleted, id]
    );
  }

  async deleteById(id) {
    return db.none(
      'DELETE FROM wizardlabs.user_community_video WHERE id = $1',
      [id]
    );
  }

  /**
   * Gets all videos for user
   * @param userId - User Id
   * @param pagingSorting - Object with pagination and sorting parameters
   * @returns {Promise<*|XPromise<any[]>>} Array of videos
   */
  async getAllVideosByUserId(userId, pagination={limit: DEFAULT_PAGING_LIMIT}) {
    let query =
      'SELECT DISTINCT ucv.id as id, ucv.created_date as created_date, uv.name, ' + 
      ' uv.url, uv.thumbnail_url, uv.tags, u.id as user_id, u.user_name as user_name, ' +
      ' uc.streamer_name as streamer_name, uc.game_mode as game_mode, ' +
      ' uc.stream_date as stream_date, uc.stream_id as stream_id ' +
      'FROM wizardlabs.user_video uv ' +
      '  INNER JOIN wizardlabs.user_clip uc ' +
      '    ON uc.id = uv.clip_id ' +
      '  INNER JOIN wizardlabs.user_community_video ucv ' +
      '    ON uv.id = ucv.video_id ' +
      '  INNER JOIN wizardlabs.user_community_member ucm ' +
      '    ON ucv.community_id = ucm.community_id ' +
      '  INNER JOIN wizardlabs.user u ' +
      '    ON uv.user_id = u.id ' +
      'WHERE u.id = $1 ' +
      'AND uv.status != $2 ';

    query = applySortAndGroup(query, pagination);
    query = applyPagination(query, pagination);

    const data = await db.any(query, [userId, VideoStatusEnum.deleted]);
    pagination.hasMore = data.length === pagination.limit;

    return {data, pagination};
  }

  /**
   * Gets all videos for community
   * @param communityId - Community Id
   * @param pagination - Object with pagination and sorting parameters
   * @returns {Promise<*|XPromise<any[]>>} Array of videos
   */
  async getAllVideosByCommunityId(communityId, pagination) {
    let query =
      'SELECT ucv.id as id, ucv.created_date as created_date, uv.name, uv.url,' +
      ' uv.thumbnail_url, uv.tags, u.id as user_id, u.user_name as user_name, ' +
      ' uc.streamer_name as streamer_name, uc.game_mode as game_mode, ' +
      ' uc.stream_date as stream_date, uc.stream_id as stream_id ' +
      'FROM wizardlabs.user_video uv ' +
      '  INNER JOIN wizardlabs.user_clip uc ' +
      '    ON uc.id = uv.clip_id ' +
      '  INNER JOIN wizardlabs.user_community_video ucv ' +
      '    ON uv.id = ucv.video_id ' +
      '  INNER JOIN wizardlabs.user u ' +
      '    ON uv.user_id = u.id ' +
      'WHERE ucv.community_id = $1 ';

    query = applySortAndGroup(query, pagination);
    query = applyPagination(query, pagination);

    const data = await db.any(query, [communityId]);
    pagination.hasMore = data.length === pagination.limit;

    return {data, pagination};
  }

  /**
   * Gets all videos for user
   * @param {number} userId - User Id
   * @returns {Promise<*|XPromise<any[]>>} Array of communities
   */
  async getAllByCommunityIds(communityIds, pagination) {
    let sortString;

    const sortOrder = pagination.sortOrder || SortOrderEnum.desc;
    if (pagination.sortBy) {
      switch (pagination.sortBy) {
        case 'createdDate':
          sortString = `ucv.created_date ${sortOrder}`;
        case 'streamerName':
          sortString = `uc.streamer_name ${sortOrder}`;
        case 'gameMode':
          sortString = `uc.game_mode ${sortOrder}`;
        case 'streamDate':
          sortString = `uc.stream_date ${sortOrder}`;
        case 'streamCaption':
          sortString = `uc.stream_id ${sortOrder}`
        default:
          sortString = `ucv.id ${sortOrder}`;
      }
    } else {
      sortString = `ucv.id ${sortOrder}`;
    }

    let query =
      'SELECT * FROM ( ' +
      '  SELECT ucv.id as id, ucv.community_id, ucv.created_date, v.name, v.url, v.tags, ' +
      '    v.thumbnail_url, uc.streamer_name as streamer_name, uc.game_mode, uc.stream_date, ' +
      '    ROW_NUMBER() OVER (' +
      '      PARTITION BY ucv.community_id ORDER BY ' + sortString +
      '    ) ' +
      '  FROM wizardlabs.user_video v ' +
      '    INNER JOIN wizardlabs.user_clip uc' +
      '      ON uc.id = v.clip_id' +
      '    INNER JOIN wizardlabs.user_community_video ucv ' +
      '      ON v.id = ucv.video_id ' +
      '  WHERE ucv.community_id IN ($1:csv) ' +
      '  AND v.status != $2 ' +
      ') t ' +
      'WHERE t.row_number <= $3 ' +
      'ORDER BY t.row_number ASC';

      //TODO: This isn't working.
    const data = await db.any(applyPagination(query, pagination), [
      communityIds,
      VideoStatusEnum.deleted,
      pagination.limit || DEFAULT_PAGING_LIMIT,
      pagination.offset || 0
    ]);
    pagination.hasMore = data.length === (pagination.limit ? pagination.limit : DEFAULT_PAGING_LIMIT);

    return {data, pagination};
  }
}

const instance = new UserCommunityVideo();
module.exports = instance;
