const SortOrderEnum = require('./enums/SortOrderEnum');
const DEFAULT_PAGING_LIMIT = process.env.DEFAULT_PAGING_LIMIT || 20;


function buildPagingSorting(query) {
  return {
    limit: query.limit || DEFAULT_PAGING_LIMIT,
    offset: query.offset || 0,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder
  };
}

function applySortAndGroup(query, pagination={}) {
  const sortOrder = pagination.sortOrder || SortOrderEnum.desc;

  if (pagination.sortBy) {
    switch (pagination.sortBy) {
      case 'createdDate':
        return query += ` ORDER BY created_date ${sortOrder} NULLS LAST`;

      case 'streamerName':
        return query += ` ORDER BY streamer_name ${sortOrder} NULLS LAST`;

      case 'gameMode':
        return query += ` ORDER BY game_mode ${sortOrder} NULLS LAST`;

      case 'streamDate':
        return query += ` ORDER BY stream_date ${sortOrder} NULLS LAST`;

      case 'streamCaption':
        return query += ` ORDER BY stream_id ${sortOrder} NULLS LAST`

      case 'channel':
      default:
        return query += ` ORDER BY id ${sortOrder} NULLS LAST`;
    }
  } else {
    return query += ` ORDER BY id ${sortOrder} NULLS LAST`;
  }
}

function applyPagination(
  query,
  pagination = {limit: DEFAULT_PAGING_LIMIT}
) {
  const {limit, offset} = pagination;

  let result = query;

  if (limit) {
    result += ` LIMIT ${limit}`;
  }

  if (offset) {
    result += ` OFFSET ${offset}`;
  }

  return result;
}

module.exports = {
  buildPagingSorting,
  applySortAndGroup,
  applyPagination
};