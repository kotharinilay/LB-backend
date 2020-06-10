const axios = require('axios');

const ProvidersEnum = require('../../../common/enums/ProvidersEnum');

const BadGatewayError = require('../../../errors/BadGatewayError');

const CLIENT_ID = process.env.TWITCH_OAUTH_CLIENT_ID;
const API_BASE_URL = process.env.TWITCH_API_BASE_URL;
const TWITCH_NEW_OAUTH_CLIENT_ID = process.env.TWITCH_NEW_OAUTH_CLIENT_ID;
const TWITCH_NEW_OAUTH_CLIENT_SECRET = process.env.TWITCH_NEW_OAUTH_CLIENT_SECRET;
const TWITCH_OAUTH_TOKEN_URL = process.env.TWITCH_OAUTH_TOKEN_URL;


class TwitchSearchService {

  async searchChannel(name) {
    const requestData = {
      url: `${TWITCH_OAUTH_TOKEN_URL}?grant_type=client_credentials&client_id=${TWITCH_NEW_OAUTH_CLIENT_ID}&client_secret=${TWITCH_NEW_OAUTH_CLIENT_SECRET}`,
      method: "POST",
    };

    let token;

    await axios
      .post(requestData.url)
      .then((response) => {
        token = response.data.access_token;
      })
      .catch((error) => {
        console.error("Cannot get request token from Twitch:", error);
        throw new BadGatewayError("Not a valid user.");
      });

    const config = {
      headers: {
        "Client-ID": TWITCH_NEW_OAUTH_CLIENT_ID,
        'Authorization': 'Bearer ' + token
      },
    };

    const url = `${API_BASE_URL}/helix/users?login=${name}`;
    console.log(url)
    

    return axios
      .get(url, config)
      .then((response) => {
        const users = response.data.data;

        return users.map((user) => {
          return convertUserDataModel(user);
        });
      })
      .catch((err) => {
        console.error(
          'Error occurred while perform channel search in Twitch: ',
          err.message ? err.message : ''
        );
        return [];
      });

  }
  
  async getVideoDetails(videoId) {
    
    const requestData = {
      url: `${TWITCH_OAUTH_TOKEN_URL}?grant_type=client_credentials&client_id=${TWITCH_NEW_OAUTH_CLIENT_ID}&client_secret=${TWITCH_NEW_OAUTH_CLIENT_SECRET}`,
      method: "POST",
    };

    let token;

    await axios
      .post(requestData.url)
      .then((response) => {
        token = response.data.access_token;
      })
      .catch((error) => {
        console.error("Cannot get request token from Twitch:", error);
        throw new BadGatewayError("Not a valid user.");
      });

    const config = {
      headers: {
        "Client-ID": TWITCH_NEW_OAUTH_CLIENT_ID,
        'Authorization': 'Bearer ' + token
      },
    };

    const url = `${API_BASE_URL}/helix/videos?id=${videoId}`;
    

    return axios
      .get(url, config)
      .then((response) => {
        const videos = response.data.data;

        return videos[0].user_name;
        
      })
      .catch((err) => {
        console.error(
          'Error occurred while perform channel search in Twitch: ',
          err.message ? err.message : ''
        );
        return [];
      });

  }
}

function convertUserDataModel(user) {
  return {
    title: user.display_name,
    id: user.id,
    description: user.description,
    thumbnailUrl: user.profile_image_url,
    source: ProvidersEnum.twitch
  };
}

const instance = new TwitchSearchService();
module.exports = instance;
