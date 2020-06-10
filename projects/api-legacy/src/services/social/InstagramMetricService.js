const ProvidersEnum = require('../../common/enums/ProvidersEnum');
const InstagramCrawlerService = require('./InstagramCrawlerService');
const UserAccountService = require('../UserAccountService');

class InstagramMetricService {
  async getMetrics(videoId, userId) {

    const account = await UserAccountService.getUserAccount(userId,
      ProvidersEnum.instagram);

    const posts = await InstagramCrawlerService.parse(account.user_data.login);
    // Here place for logic to process videos

  }
}



const instance = new InstagramMetricService();
module.exports = instance;
