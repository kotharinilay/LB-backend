const {db, pgp} = require('../services/DatabaseService');

const SortOrderEnum = require('../common/enums/SortOrderEnum');
const tableName = new pgp.helpers.TableName({
  table: 'user_overlay',
  schema: 'wizardlabs'
});

const DEFAULT_PAGING_LIMIT = process.env.DEFAULT_PAGING_LIMIT || 20;

class UserOverlay {
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
      'SELECT * FROM wizardlabs.user_overlay WHERE id = $1',
      [id]
    );
  }

  async getCommonById(id) {
    return db.oneOrNone(
      'SELECT * FROM wizardlabs.community_overlay WHERE id = $1',
      [id]
    );
  }

  async getByIdAndUserId(id, userId) {
    return db.oneOrNone(
      'SELECT * FROM wizardlabs.user_overlay WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
  }

  async getByUserId(userId, pagingSorting) {
    const {
      limit = DEFAULT_PAGING_LIMIT,
      nextCursor,
      sortBy = 'id',
      sortOrder = SortOrderEnum.desc
    } = pagingSorting;
    let query = `SELECT * FROM wizardlabs.user_overlay` +
      `  WHERE user_id = ${userId}`;

    if (sortBy) {
      query += ` ORDER BY ${sortBy} ${sortOrder}`;
    }
    if (nextCursor) {
      query += ` OFFSET ${nextCursor}`;
    }
    query += ` LIMIT ${limit}`;

    const data = await db.any(query);
    const pagination = buildPagination(limit, data.length, nextCursor);

    return {
      data: data,
      pagination: pagination
    };
  }

  async getAllByUserId(userId, pagingSorting) {
    const {
      limit = DEFAULT_PAGING_LIMIT,
      nextCursor,
      sortBy = 'id',
      sortOrder = SortOrderEnum.desc
    } = pagingSorting;
    let query = `SELECT * FROM wizardlabs.user_overlay_view` +
      `  WHERE user_id = ${userId} OR user_id IS NULL`;

    if (sortBy) {
      query += ` ORDER BY ${sortBy} ${sortOrder}`;
    }
    if (nextCursor) {
      query += ` OFFSET ${nextCursor}`;
    }
    query += ` LIMIT ${limit}`;

    const data = await db.any(query);
    const pagination = buildPagination(limit, data.length, nextCursor);

    return {
      data: data,
      pagination: pagination
    };
  }

  async getRecent(userId, pagingSorting) {
    const {limit = DEFAULT_PAGING_LIMIT, nextCursor} = pagingSorting;
    let query = `SELECT * FROM wizardlabs.user_overlay` +
      `  WHERE user_id = ${userId}` +
      `  ORDER BY last_used_date desc, created_date desc` +
      `  LIMIT ${limit}`;

    if (nextCursor) {
      query += ` OFFSET ${nextCursor}`;
    }

    const data = await db.any(query);
    const pagination = buildPagination(limit, data.length, nextCursor);

    return {
      data: data,
      pagination: pagination
    };
  }

  async delete(id) {
    return db.none('DELETE FROM wizardlabs.user_overlay WHERE id = $1', [id]);
  }
}

function buildPagination(limit, size, offset = 0) {
  const result = {};

  if (limit === size) {
    result.nextCursor = limit + parseInt(offset, 10);
  }

  return result;
}

const instance = new UserOverlay();
module.exports = instance;
