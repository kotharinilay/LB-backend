const {db, pgp} = require('../services/DatabaseService');

const tableName = new pgp.helpers.TableName({
  table: 'cinematics',
  schema: 'wizardlabs'
});

class Cinematic {

  async delete(id) {
    return db.none(
      'UPDATE wizardlabs.cinematics ' +
      '  SET status = $1 ' +
      'WHERE id = $2 ',
      ["DELETED", id]
    );
  }

  async create(data) {
    const query = pgp.helpers.insert(data, null, tableName) + ' RETURNING id';
    return db.one(query)
      .then((data) => data.id);
  }

  async getByUserId(user_id) {
    return db.any(
      'SELECT wizardlabs.cinematics.*, wizardlabs.user_clip.url AS clip_url FROM wizardlabs.cinematics LEFT JOIN wizardlabs.user_clip ON (wizardlabs.user_clip.id = wizardlabs.cinematics.clip_id) WHERE wizardlabs.cinematics.user_id = $1 AND wizardlabs.cinematics.status = $2', [user_id,"COMPLETED"]
    );
  }
}

const instance = new Cinematic();
module.exports = instance;
