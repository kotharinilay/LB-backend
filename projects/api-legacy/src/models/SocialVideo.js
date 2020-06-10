const {db, pgp} = require('../services/DatabaseService');

const tableName = new pgp.helpers.TableName({
  table: 'social_videos',
  schema: 'wizardlabs'
});

class SocialVideo {
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

  async getBySocialVideoId(socialVideoId) {
    var sql = '';

    sql = 'SELECT ' +
        'wizardlabs.social_videos.id AS social_video_id, ' +
        'wizardlabs.user_video.name, ' +
        'wizardlabs.user_video.url, ' +
        'wizardlabs.user_video.thumbnail_url, ' +
        'wizardlabs.user_video.metadata, ' +
        'wizardlabs.user_video.user_id, ' +
        'wizardlabs.user_video.created_date ' +
    'FROM wizardlabs.social_videos ' +
    'LEFT JOIN wizardlabs.user_video ON (wizardlabs.social_videos.user_video_id = wizardlabs.user_video.id)' +
    'WHERE ' +
    ' wizardlabs.social_videos.id = $1 AND ' +
    ' wizardlabs.user_video.thumbnail_url IS NOT NULL AND ' +
    ' wizardlabs.user_video.url IS NOT NULL AND ' +
    ' wizardlabs.user_video.name IS NOT NULL AND ' +
    ' wizardlabs.user_video.status != \'DELETED\''

    return db.oneOrNone(sql, [socialVideoId]);
  }  

  async getAllVideos() {

    var sql = '';

    sql = 'SELECT ' +
        'wizardlabs.social_videos.id AS social_video_id, ' +
        'wizardlabs.user_video.name, ' +
        'wizardlabs.user_video.url, ' +
        'wizardlabs.user_video.thumbnail_url, ' +
        'wizardlabs.user_video.metadata, ' +
        'wizardlabs.user_video.user_id, ' +
        'wizardlabs.user_video.created_date ' +
    'FROM wizardlabs.social_videos ' +
    'LEFT JOIN wizardlabs.user_video ON (wizardlabs.social_videos.user_video_id = wizardlabs.user_video.id)' +
    'WHERE ' +
    ' wizardlabs.user_video.thumbnail_url IS NOT NULL AND ' +
    ' wizardlabs.user_video.url IS NOT NULL AND ' +
    ' wizardlabs.user_video.name IS NOT NULL AND ' +
    ' wizardlabs.user_video.status != \'DELETED\'' +
    ' ORDER BY wizardlabs.user_video.created_date desc'

    return db.any(sql);
  }

  async deleteByUserVideoId(user_video_id) {
    return db.none('DELETE FROM wizardlabs.social_videos WHERE user_video_id = $1', [user_video_id]);
  }
}

const instance = new SocialVideo();
module.exports = instance;
