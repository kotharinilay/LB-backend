const {db} = require('../services/DatabaseService');

class Game {
  async getById(id) {
    return db.oneOrNone('SELECT * FROM wizardlabs.game WHERE id = $1', [id]);
  }

  async getByName(name) {
    return db.any('SELECT * FROM wizardlabs.game WHERE name ILIKE \'$1#%\'', [name]);
  }

  async getAll() {
    return db.any('SELECT * FROM wizardlabs.game ORDER BY name');
  }
}

const instance = new Game();
module.exports = instance;
