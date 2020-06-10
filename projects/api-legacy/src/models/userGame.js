const {db, pgp} = require('../services/DatabaseService');

const tableName = new pgp.helpers.TableName({
  table: 'user_game',
  schema: 'wizardlabs'
});

class UserGame {
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

  async getByUserId(userId) {
    return db.any(
      'SELECT * FROM wizardlabs.user_game WHERE user_id = $1', [userId]
    );
  }

  async getByIdAndUserId(id, userId) {
    return db.oneOrNone(
      'SELECT * FROM wizardlabs.user_game WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
  }

  async countByGameIdsAndUserId(gameIds, userId) {
    return db.one('SELECT COUNT(*) FROM wizardlabs.user_game ' +
      ' WHERE game_id IN ($1:csv) AND user_id = $2',
      [gameIds, userId]
    );
  }

  async delete(id) {
    return db.none('DELETE FROM wizardlabs.user_game WHERE id = $1', [id]);
  }
}

const instance = new UserGame();
module.exports = instance;
