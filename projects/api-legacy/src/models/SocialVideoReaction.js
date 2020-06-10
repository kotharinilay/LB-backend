const {db, pgp} = require('../services/DatabaseService');

const tableName = new pgp.helpers.TableName({
  table: 'social_video_reactions',
  schema: 'wizardlabs'
});

class SocialVideoReaction {

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

  async deleteByUserIdAndSocialVideoId(userId, socialVideoId) {

    return db.none('DELETE FROM wizardlabs.social_video_reactions WHERE social_video_id = $1 AND user_id = $2', [socialVideoId, userId]);

    // db.result('DELETE FROM wizardlabs.social_video_reactions WHERE social_video_id = $1 AND user_id = $2', [socialVideoId, userId]).then(result => {
    //   if (result.rowCount >= 1){
    //     output = true;
    //   }
    // })
    // .catch(error => {
    //   console.log('ERROR:', error);
    // });

    // return output;
  }

  async getBySocialVideoId(social_video_id) {
    return db.oneOrNone('SELECT * FROM wizardlabs.social_video_reactions WHERE social_video_id = $1', [social_video_id]);
  }
}

const instance = new SocialVideoReaction();
module.exports = instance;
