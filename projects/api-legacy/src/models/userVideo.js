const {db, pgp} = require('../services/DatabaseService');

const {applySortAndGroup, applyPagination} = require('../common/PagingSorting');
const VideoStatusEnum = require('../common/enums/VideoStatusEnum');

const tableName = new pgp.helpers.TableName({
  table: 'user_video',
  schema: 'wizardlabs'
});

class UserVideo {
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
      'SELECT * FROM wizardlabs.user_video '+
      '  WHERE id = $1 ' +
      '  AND status != $2 ',
      [id, VideoStatusEnum.deleted]
    );
  }

  async getByIdAndUserId(id, userId, ignoreStatus) {
    let query = 'SELECT * FROM wizardlabs.user_video ' +
      'WHERE id = $1 AND user_id = $2';
    if (ignoreStatus !== true) {
      query += ' AND status = $3';
    } else {
      query += ' AND status != $3'
    }

    const queryArgs = [
      id,
      userId,
      ignoreStatus !== true
        ? VideoStatusEnum.completed
        : VideoStatusEnum.deleted
    ];

    return db.oneOrNone(query, queryArgs);
  }

  async getByUserId(userId, pagingSorting) {
    let query =
      'SELECT uv.id, uv.name, uv.path, uv.thumbnail_path, uv.url, ' +
      ' uv.thumbnail_url, uv.metadata, uv.tags, uv.status, ' +
      ' uv.type, uv.user_id, uv.upload_date, uv.created_date as created_date, ' +
      ' uv.clip_id, uc.streamer_name as streamer_name, uc.game_mode as game_mode, ' +
      ' uc.stream_id as stream_id, u.id as user_id, u.user_name ' +
      'FROM wizardlabs.user_video uv ' +
      '  INNER JOIN wizardlabs.user_clip uc ' +
      '   ON uv.clip_id = uc.id ' +
      ' INNER JOIN wizardlabs.user as u ' +
      '   ON uv.user_id = u.id ' +
      'WHERE uv.user_id = $1 ' +
      'AND uv.status = $2 '

    query = applySortAndGroup(query, pagingSorting);
    query = applyPagination(query, pagingSorting);

    const data = await db.any(query, [userId, VideoStatusEnum.completed]);
    pagingSorting.hasMore = data.length === pagingSorting.limit;

    return {data, pagination: pagingSorting};
  }
  
  async getAllVideos(pagingSorting, userId) {

    let query =
      'SELECT uv.id, uv.name, uv.path, uv.thumbnail_path, uv.url, ' +
      ' uv.thumbnail_url, uv.metadata, uv.tags, uv.status, ' +
      ' uv.type, uv.user_id, uv.upload_date, uv.created_date as created_date, ' +
      ' uv.clip_id, uc.streamer_name as streamer_name, uc.game_mode as game_mode, ' +
      ' uc.stream_id as stream_id, u.id as user_id, u.user_name, ' +
      '  COUNT(svr.social_video_id) as like_count, svru.id as like_status, array_to_json(array_agg(row(svc.*, cu.*) order by svc.created_date desc)) as comments ' +
      'FROM wizardlabs.user_video uv ' +
      '  INNER JOIN wizardlabs.user_clip uc ' +
      '   ON uv.clip_id = uc.id ' +
      ' INNER JOIN wizardlabs.user as u ' +
      '   ON uv.user_id = u.id ' +
      ' LEFT JOIN wizardlabs.social_video_reactions svr ON svr.social_video_id = uv.id ' +
      ' LEFT JOIN wizardlabs.social_video_comments svc ON svc.social_video_id = uv.id ' +
      ' LEFT JOIN wizardlabs.user cu ON svc.comment_user_id = cu.id ' +
      ' LEFT JOIN wizardlabs.social_video_reactions svru ON svru.social_video_id = uv.id AND svru.user_id = $2 ' +
      'WHERE uv.status = $1 group by uv.id, uc.id, u.id, svru.id'

    query = applySortAndGroup(query, pagingSorting);
    query = applyPagination(query, pagingSorting);

    const data = await db.any(query, [VideoStatusEnum.completed, userId]);
    pagingSorting.hasMore = data.length === pagingSorting.limit;

    return {data, pagination: pagingSorting};
  }

  async delete(id) {
    return db.none(
      'UPDATE wizardlabs.user_video ' +
      'SET status = $1 ' +
      'WHERE id = $2', [VideoStatusEnum.deleted, id]
    );
  }
}

const instance = new UserVideo();
module.exports = instance;
