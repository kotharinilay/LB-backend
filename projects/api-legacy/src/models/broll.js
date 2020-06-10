const { db } = require("../services/DatabaseService");

const ClipStatusEnum = require("../common/enums/ClipStatusEnum");

const DEFAULT_PAGING_LIMIT = process.env.DEFAULT_PAGING_LIMIT || 20;
const {
  applySortAndGroup,
  applyPagination,
} = require("../common/PagingSorting");

class BRoll {
  async getByTypeAndTags(
    tag,
    type,
    search,
    pagination = { limit: DEFAULT_PAGING_LIMIT }
  ) {

    let query = "";

    if(search){

      query = "select * from ( SELECT *, unnest(tags) tagx FROM b_roll) x ";

    }else{

      query = "select * from b_roll";

    }

    let params = [];
    let count = params.length + 1;

    if (type) {
      query = query + " Where type = $" + count + " ";
      params.push(type);
      count++;
    }

    if (tag && !search) {
      let tagArray = tag.split(",");
      if (type) {
        query = query + " AND tags @> $" + count + " ";
      } else {
        query = query + " where tags @> $" + count + " ";
      }
      params.push(tagArray);
      count++;
    }
    
    if (search) {
      if (type || tag) {
        query = query + " AND (( name ILIKE '$" + count + "#%' ) OR ( tagx ILIKE '$"+ count +"#%' )) ";
      } else {
        query = query + " where ( name ILIKE '$" + count + "#%' ) OR ( tagx ILIKE '$"+ count +"#%' ) ";
      }
      params.push(search);
      count++;
    }
    query = applySortAndGroup(query, pagination);
    query = applyPagination(query, pagination);

    const data = await db.any(query, params);

    pagination.hasMore = data.length === pagination.limit;

    return { data, pagination };
  }

  async getTopTags(type) {

    let data;

    if (type) {
      let query =
        "SELECT tags.name, COUNT(tags) as count " +
        " FROM (SELECT UNNEST(tags) as name FROM wizardlabs.b_roll where type=$1 " +
        ") as tags " +
        " GROUP BY tags.name " +
        " ORDER BY count DESC ";

      data = await db.any(query, [type]);
    } else {
      let query =
        "SELECT tags.name, COUNT(tags) as count " +
        " FROM (SELECT UNNEST(tags) as name FROM wizardlabs.b_roll " +
        ") as tags " +
        " GROUP BY tags.name " +
        " ORDER BY count DESC ";

      data = await db.any(query, []);
    }

    return { data };
  }
}

const instance = new BRoll();
module.exports = instance;
