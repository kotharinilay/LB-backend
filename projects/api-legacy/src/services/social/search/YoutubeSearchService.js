const axios = require('axios');
const qs = require('qs');

const ProvidersEnum = require('../../../common/enums/ProvidersEnum');

const API_KEY = process.env.YOUTUBE_API_KEY;
const API_BASE_URL = process.env.YOUTUBE_API_BASE_URL;

class YoutubeSearchService {
  async searchChannel(name) {
    const requestData = qs.stringify({
      type: 'channel',
      part: 'snippet',
      maxResults: 20,
      q: name,
      key: API_KEY
    });

    return axios
      .get(`${API_BASE_URL}/youtube/v3/search?${requestData}`)
      .then((response) => {
        const channels = response.data.items;

        return channels
          .filter((channel) => {
            const title = channel.snippet.title.toLowerCase();
            return title.startsWith(name.toLowerCase());
          })
          .map((channel) => convertChannelDataModel(channel));
      })
      .catch((error) => {
        console.error(
          'Error occurred while perform channel search in YouTube: ',
          error.message ? error.message : ''
        );
        return [];
      });
  }
}

function convertChannelDataModel(channel) {
  const snippet = channel.snippet;

  return {
    title: snippet.title,
    id: snippet.channelId,
    description: snippet.description,
    thumbnailUrl: snippet.thumbnails.default.url,
    source: ProvidersEnum.youtube
  };
}

const instance = new YoutubeSearchService();
module.exports = instance;
