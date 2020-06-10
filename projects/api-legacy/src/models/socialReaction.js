const {db, pgp} = require('../services/DatabaseService');

const tableName = new pgp.helpers.TableName({
  table: 'social_reactions',
  schema: 'wizardlabs'
});

class SocialReaction {
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

  async getAll() {
    return db.any('SELECT * FROM wizardlabs.social_reactions');
  }

  async getByReaction(reaction) {
    return db.oneOrNone(
      'SELECT * FROM wizardlabs.social_reactions WHERE reaction = $1', [emoji]
    );
  }
}

const instance = new SocialReaction();
module.exports = instance;
