const {db, pgp} = require('../services/DatabaseService');

const ClipStatusEnum = require('../common/enums/ClipStatusEnum');

const DEFAULT_PAGING_LIMIT = process.env.DEFAULT_PAGING_LIMIT || 20;
const {applySortAndGroup, applyPagination} = require('../common/PagingSorting');

const tableName = new pgp.helpers.TableName({
  table: 'user_clip',
  schema: 'wizardlabs'
});

class UserClip {
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
      'SELECT * FROM wizardlabs.user_clip ' +
      ' WHERE id = $1' +
      ' AND status != $2',
       [id, ClipStatusEnum.deleted]
    );
  }

  async getByIdAndUserId(id, userId, ignoreStatus) {
    let query =
      'SELECT * FROM wizardlabs.user_clip ' +
      '  WHERE id = $1 AND user_id = $2';

    if (ignoreStatus !== true) {
      query += ' AND status = $3';
    } else {
      query += ' AND status != $3';
    }

    const clipStatus = ignoreStatus
      ? ClipStatusEnum.deleted
      : ClipStatusEnum.completed;

    return db.oneOrNone(query, [id, userId, clipStatus]);
  }

  async getByUserId(userId, pagination) {
    let query =
      'SELECT uc.id as id, uc.name, uc.game_name, uc.path, uc.thumbnail_path, ' +
      '  uc.url, uc.thumbnail_url, uc.metadata, uc.tags, uc.stream_id as stream_id, uc.type, ' +
      '  uc.user_id, uc.created_date as created_date, uc.ai_title, uc.streamer_name as streamer_name, ' +
      '  uc.game_mode as game_mode, uc.stream_date as stream_date, uc.labels, u.user_name ' +
      'FROM wizardlabs.user_clip uc ' +
      'INNER JOIN wizardlabs.user u ' +
      '   ON uc.user_id = u.id ' +
      ' AND uc.user_id = $1 ' +
      ' AND uc.status = $2 ';

    query = applySortAndGroup(query, pagination);
    query = applyPagination(query, pagination);

    const data = await db.any(query, [userId, ClipStatusEnum.completed]);
    pagination.hasMore = data.length === pagination.limit;

    return {data, pagination};
  }

  async getByUserIdAndType(userId, type, pagination={limit: DEFAULT_PAGING_LIMIT}) {
    let query =
      'SELECT uc.id as id, uc.name, uc.game_name, uc.path, uc.thumbnail_path, ' +
      '  uc.url, uc.thumbnail_url, uc.metadata, uc.tags, uc.stream_id as stream_id, uc.type, ' +
      '  uc.user_id, uc.created_date as created_date, uc.ai_title, uc.streamer_name as streamer_name, ' +
      '  uc.game_mode as game_mode, uc.stream_date as stream_date, uc.labels, u.user_name ' +
      'FROM wizardlabs.user_clip uc ' +
      'INNER JOIN wizardlabs.user u ' +
      '   ON uc.user_id = u.id ' +
      ' AND uc.user_id = $1 ' +
      ' AND uc.type = $2 ' +
      ' AND uc.status = $3 ';

    query = applySortAndGroup(query, pagination);
    query = applyPagination(query, pagination);

    const data = await db.any(query, [userId, type, ClipStatusEnum.completed]);
    pagination.hasMore = data.length === pagination.limit;

    return {data, pagination};
  }

  async getByUserIdAndTagQuery(userId, tag, pagination = {limit: DEFAULT_PAGING_LIMIT}) {
    let query =
      'SELECT uc.id as id, uc.name, uc.game_name, uc.path, uc.thumbnail_path, ' +
      '  uc.url, uc.thumbnail_url, uc.metadata, uc.tags, uc.stream_id as stream_id, uc.type, ' +
      '  uc.user_id, uc.created_date as created_date, uc.ai_title, uc.streamer_name as streamer_name, ' +
      '  uc.game_mode as game_mode, uc.stream_date as stream_date, uc.labels ' +
      'FROM wizardlabs.user_clip uc ' +
      '  WHERE user_id = $1' +
      '  AND $2 = ANY (uc.tags) ' +
      '  AND status = $3 ';

    query = applySortAndGroup(query, pagination);
    query = applyPagination(query, pagination);
    const data = await db.any(query, [userId, tag, ClipStatusEnum.completed]);
    pagination.hasMore = data.length === pagination.limit;

    return {data, pagination};
  }

  async getTopTags(userId, pagination = {limit: DEFAULT_PAGING_LIMIT}) {
    let query =
      'SELECT tags.name, COUNT(tags) as count ' + 
      ' FROM (SELECT UNNEST(tags) as name FROM wizardlabs.user_clip ' +
      ' WHERE status = $1 ' + 
      (userId ? ' AND user_id = $2 ' : '') +
      ') as tags ' + 
      ' GROUP BY tags.name ' + 
      ' ORDER BY count DESC '

    query = applyPagination(query, pagination);
    const data = await db.any(query, [ClipStatusEnum.completed, userId]);
    pagination.hasMore = data.length === pagination.limit;

    return {data, pagination};
  }

  async getTopGames(userId, pagination = {limit: DEFAULT_PAGING_LIMIT}) {
    let query =
      'SELECT game, COUNT(game) as count ' + 
      ' FROM (SELECT game_name as game FROM wizardlabs.user_clip ' +
      ' WHERE status = $1 ' + 
      (userId ? ' AND user_id = $2 ' : '') +
      ') as tags ' + 
      ' GROUP BY game ' + 
      ' ORDER BY count DESC '

    query = applyPagination(query, pagination);
    const data = await db.any(query, [ClipStatusEnum.completed, userId]);
    pagination.hasMore = data.length === pagination.limit;

    return {data, pagination};
  }

  async getByUserIdAndNameQuery(userId, name, pagination = {limit: DEFAULT_PAGING_LIMIT}) {
    let query =
      'SELECT uc.id as id, uc.name, uc.game_name, uc.path, uc.thumbnail_path, ' +
      '  uc.url, uc.thumbnail_url, uc.metadata, uc.tags, uc.stream_id as stream_id, uc.type, ' +
      '  uc.user_id, uc.created_date as created_date, uc.ai_title, uc.streamer_name as streamer_name, ' +
      '  uc.game_mode as game_mode, uc.stream_date as stream_date, uc.labels ' +
      'FROM wizardlabs.user_clip uc ' +
      'WHERE user_id = $1 AND uc.name ILIKE \'$2#%\'' +
      ' AND status = $3';
    
    query = applySortAndGroup(query, pagination);
    query = applyPagination(query, pagination);

    const data = await db.any(query, [userId, name, ClipStatusEnum.completed]);
    pagination.hasMore = data.length === pagination.limit;

    return {data, pagination};
  }
  
  async getClipsDataPaginatedByTagByNameByTime(userId, tag, name, killCount, killDistance, weaponType, streamer, gameMode, fromTime, toTime, game, pagination = {limit: DEFAULT_PAGING_LIMIT}) {
    
    let queryMetadata = killCount != undefined || killDistance != undefined || weaponType != undefined || streamer != undefined || gameMode != undefined

    let query =
      'SELECT uc.id as id, uc.name, uc.game_name, uc.path, uc.thumbnail_path, ' +
      '  uc.url, uc.thumbnail_url, uc.metadata, uc.tags, uc.stream_id as stream_id, uc.type, ' +
      '  uc.user_id, uc.created_date as created_date, uc.ai_title, uc.streamer_name as streamer_name, ' +
      '  uc.game_mode as game_mode, uc.stream_date as stream_date, uc.labels, u.user_name, u.email, u.avatar, u.name as username ' +
      (killCount ? " , ucm.metadata->>'kill_count' as kill_count " : '') +
      (killDistance ? " , ucm.metadata->>'kill_distance' as kill_distance " : '') +
      (weaponType ? " , ucm.metadata->>'main_weapon' as main_weapon " : '') +
      'FROM wizardlabs.user_clip uc ' +
      (queryMetadata ? ' LEFT JOIN wizardlabs.user_clip_metadata ucm ON ucm.clip_id = uc.id ' : '') +
      ' LEFT JOIN wizardlabs.user u ' +
      '   ON uc.user_id = u.id '+
      ' WHERE uc.user_id = $1' +
      ' AND uc.status = $2 ' + 
      (killCount ? " AND (ucm.metadata->>'kill_count')::numeric >= $3 " : '') +
      (killDistance ? " AND (ucm.metadata->>'kill_distance')::numeric >= $4 " : '') +
      (weaponType ? " AND (ucm.metadata->>'main_weapon')::text like $5 " : '') +
      (streamer ? " AND uc.streamer_name ILIKE '%$6#%'" : '') +
      (gameMode ? " AND uc.game_mode ILIKE '%$7#%' " : '') 

      let params = [userId, ClipStatusEnum.completed, killCount, killDistance, weaponType, streamer, gameMode];
      let count = params.length+1;
      
      if(name){
        query = query + " AND ( uc.name ILIKE '%$"+count+"#%' ) "
        params.push(name);
        count++;
      }
      
      if(tag){
        let tagArray = tag.split(",");
        query = query + " AND uc.tags @> $"+count+" "
        params.push(tagArray);
        count++;
      }

      if(fromTime){
        query = query + " AND uc.created_date >= '$"+count+"#' "
        params.push(fromTime);
        count++;
      }

      if(toTime){
        query = query + " AND uc.created_date <= '$"+count+"#' "
        params.push(toTime);
        count++;
      }
      
      if(game){
        query = query + " AND uc.game_name = $"+count+ " "
        params.push(game);
        count++;
      }


    query = applySortAndGroup(query, pagination);
    query = applyPagination(query, pagination);

    // console.log(query)
    // console.log(params)

    const data = await db.any(query, params);
    pagination.hasMore = data.length === pagination.limit;

    return {data, pagination};
  }

  async getForUsersFromSameCommunitiesByUserId(userId, tag, name, killCount, killDistance, weaponType, streamer, gameMode, fromTime, toTime, game,  pagination = {limit: DEFAULT_PAGING_LIMIT}) {
    let queryMetadata = killCount != undefined || killDistance != undefined || weaponType != undefined || streamer != undefined || gameMode != undefined

    let query =
      'SELECT uc.id as id, uc.name, uc.game_name, uc.path, uc.thumbnail_path, ' +
      '  uc.url, uc.thumbnail_url, uc.metadata, uc.tags, uc.stream_id as stream_id, uc.type, ' +
      '  uc.user_id, uc.created_date as created_date, uc.ai_title, uc.streamer_name as streamer_name, ' +
      '  uc.labels, uc.game_mode as game_mode, uc.stream_date as stream_date ' +
      (killCount ? " , ucm.metadata->>'kill_count' as kill_count " : '') +
      (killDistance ? " , ucm.metadata->>'kill_distance' as kill_distance " : '') +
      (weaponType ? " , ucm.metadata->>'main_weapon' as main_weapon " : '') +
      'FROM wizardlabs.user_clip uc ' +
      (queryMetadata ? ' LEFT JOIN wizardlabs.user_clip_metadata ucm ON ucm.clip_id = uc.id ' : '') +
      'LEFT JOIN wizardlabs.user u ' +
      '  ON uc.user_id = u.id ' +
      'WHERE uc.status = $1 AND uc.user_id IN ( ' +
      '   SELECT DISTINCT ucm2.user_id ' +
      '   FROM wizardlabs.user_community_member ucm1 ' +
      '     LEFT JOIN wizardlabs.user_community_member ucm2 ' +
      '       ON ucm1.community_id = ucm2.community_id ' +
      '     AND ucm2.user_id != $2 ' +
      '   WHERE ucm1.user_id = $2 ' +
      ') ' +
      (killCount ? " AND (ucm.metadata->>'kill_count')::numeric >= $3 " : '') +
      (killDistance ? " AND (ucm.metadata->>'kill_distance')::numeric >= $4 " : '') +
      (weaponType ? " AND (ucm.metadata->>'main_weapon')::text like $5 " : '') +
      (streamer ? " AND uc.streamer_name ILIKE '%$6#%' " : '') + 
      (gameMode ? " AND uc.game_mode ILIKE '%$7#%'" : '')

      let params = [ClipStatusEnum.completed, userId, killCount, killDistance, weaponType, streamer, gameMode];
      let count = params.length+1;
      
      if(name){
        query = query + " AND ( uc.name ILIKE '%$"+count+"#%' ) "
        params.push(name);
        count++;
      }
      
      if(tag){
        let tagArray = tag.split(",");
        query = query + " AND uc.tags @> $"+count+" "
        params.push(tagArray);
        count++;
      }

      if(fromTime){
        query = query + " AND uc.created_date >= '$"+count+"#' "
        params.push(fromTime);
        count++;
      }

      if(toTime){
        query = query + " AND uc.created_date <= '$"+count+"#' "
        params.push(toTime);
        count++;
      }
      
      if(game){
        query = query + " AND uc.game_name = $"+count+" "
        params.push(game);
        count++;
      }

    query = applySortAndGroup(query, pagination);
    query = applyPagination(query, pagination);

    // console.log(query)
    // console.log(params)

    const data = await db.any(query, params);

    pagination.hasMore = data.length === pagination.limit;

    return {data, pagination};
  }

  async getAllActiveClips(tag, name, killCount, killDistance, weaponType, streamer, gameMode, fromTime, toTime,  pagination = {limit: DEFAULT_PAGING_LIMIT}) {
    let queryMetadata = killCount != undefined || killDistance != undefined || weaponType != undefined || streamer != undefined || gameMode != undefined

    let query =
      'SELECT uc.id as id, uc.name, uc.game_name, uc.path, uc.thumbnail_path, ' +
      '  uc.url, uc.thumbnail_url, uc.metadata, uc.tags, uc.stream_id as stream_id, uc.type, ' +
      '  uc.user_id, uc.created_date as created_date, uc.ai_title, uc.streamer_name as streamer_name, ' +
      '  uc.labels, uc.game_mode as game_mode, uc.stream_date as stream_date, ' +
      '  u.id as user_id, u.user_name as user_name ' +
      (killCount ? " , ucm.metadata->>'kill_count' as kill_count " : '') +
      (killDistance ? " , ucm.metadata->>'kill_distance' as kill_distance " : '') +
      (weaponType ? " , ucm.metadata->>'main_weapon' as main_weapon " : '') +
      'FROM wizardlabs.user_clip uc ' +
      (queryMetadata ? ' LEFT JOIN wizardlabs.user_clip_metadata ucm ON ucm.clip_id = uc.id ' : '') +
      'LEFT JOIN wizardlabs.user u ' +
      '  ON uc.user_id = u.id ' +
      'WHERE uc.status = $1 AND uc.type=\'AUTO\' ' +
      (killCount ? " AND (ucm.metadata->>'kill_count')::numeric >= $3 " : '') +
      (killDistance ? " AND (ucm.metadata->>'kill_distance')::numeric >= $4 " : '') +
      (weaponType ? " AND (ucm.metadata->>'main_weapon')::text like $5 " : '') +
      (streamer ? " AND uc.streamer_name ILIKE '%$6#%' " : '') + 
      (gameMode ? " AND uc.game_mode ILIKE '%$7#%'" : '')

      let params = [ClipStatusEnum.completed, killCount, killDistance, weaponType, streamer, gameMode];
      let count = params.length+1;
      
      if(name){
        query = query + " AND ( uc.name ILIKE '%$"+count+"#%' ) "
        params.push(name);
        count++;
      }
      
      if(tag){
        let tagArray = tag.split(",");
        query = query + " AND uc.tags @> $"+count+" "
        params.push(tagArray);
        count++;
      }

      if(fromTime){
        query = query + " AND uc.created_date >= '$"+count+"#' "
        params.push(fromTime);
        count++;
      }

      if(toTime){
        query = query + " AND uc.created_date <= '$"+count+"#' "
        params.push(toTime);
        count++;
      }

    query = applySortAndGroup(query, pagination);
    query = applyPagination(query, pagination);

    // console.log(query)
    // console.log(params)

    const data = await db.any(query, params);

    pagination.hasMore = data.length === pagination.limit;

    return {data, pagination};
  }

  async delete(id) {
    return db.none(
      'UPDATE wizardlabs.user_clip ' +
      '  SET status = $1 ' +
      'WHERE id = $2 ',
      [ClipStatusEnum.deleted, id]
    );
  }

  /**
   * Gets a list of all the streamers the user has indexed
   * @param userId1 - User 1 Id
   * @returns {Promise<*|XPromise<any>>} Promise that contains an array of streamers
   */
  async getStreamers(userId) {

    return db.any(
        'SELECT DISTINCT uc.streamer_name FROM user_clip uc' +
        ' WHERE uc.streamer_name IS NOT NULL AND uc.status != \'DELETED\' AND uc.user_id=$1' +
        'ORDER BY uc.streamer_name ASC',
        [userId]
    );
  }
}

const instance = new UserClip();
module.exports = instance;
