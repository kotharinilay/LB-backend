const {db, pgp} = require('../services/DatabaseService');

const tableName = new pgp.helpers.TableName({
  table: 'social_tags',
  schema: 'wizardlabs'
});

class SocialTag {
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
    return db.oneOrNone('SELECT * FROM wizardlabs.social_tags WHERE id = $1', [id]);
  }

  async getByTag(tag) {
    console.log(tag)
    return db.oneOrNone(
      'SELECT * FROM wizardlabs.social_tags WHERE tag = $1 AND status = $2', [tag,"CREATED"]
    );
  }
}

const instance = new SocialTag();
module.exports = instance;
