const {db, pgp} = require('../services/DatabaseService');

const BumperStatusEnum = require('../common/enums/BumperStatusEnum');
const tableName = new pgp.helpers.TableName({
  table: 'user_bumper',
  schema: 'wizardlabs'
});

class UserBumper {
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
      'SELECT * FROM wizardlabs.user_bumper WHERE id = $1',
      [id]
    );
  }

  async getCommonById(id) {
    return db.oneOrNone(
      'SELECT * FROM wizardlabs.community_bumper WHERE id = $1',
      [id]
    );
  }

  async getByIdAndUserId(id, userId) {
    return db.oneOrNone(
      'SELECT * FROM wizardlabs.user_bumper WHERE id = $1 AND user_id = $2' +
      '  AND status = $3',
      [id, userId, BumperStatusEnum.completed]
    );
  }

  async getByUserId(userId) {
    return db.any(
      'SELECT * FROM wizardlabs.user_bumper WHERE user_id = $1' +
      '  AND status = $2' +
      '  ORDER BY id DESC',
      [userId, BumperStatusEnum.completed]
    );
  }

  async getAllByUserId(userId) {
    return db.any(
      'SELECT * FROM wizardlabs.user_bumper_view WHERE user_id IS NULL' +
      ' OR (user_id = $1 AND status = $2)' +
      '  ORDER BY id DESC',
      [userId, BumperStatusEnum.completed]
    );
  }

  async getByUserIdAndType(userId, type) {
    return db.any(
      'SELECT * FROM wizardlabs.user_bumper WHERE user_id = $1 AND type = $2' +
      '  AND status = $3' +
      '  ORDER BY id DESC',
      [userId, type, BumperStatusEnum.completed]
    );
  }

  async getAllByUserIdAndType(userId, type) {
    return db.any(
      'SELECT * FROM wizardlabs.user_bumper_view WHERE type = $2' +
      ' AND (user_id IS NULL OR (user_id = $1 AND status = $3))' +
      '  ORDER BY id DESC',
      [userId, type, BumperStatusEnum.completed]
    );
  }

  async delete(id) {
    return db.none('DELETE FROM wizardlabs.user_bumper WHERE id = $1', [id]);
  }
}

const instance = new UserBumper();
module.exports = instance;
