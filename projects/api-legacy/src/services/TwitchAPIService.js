const axios = require('axios');

const BadGatewayError = require('../errors/BadGatewayError');

const TWITCH_OAUTH_BASE_URL = process.env.TWITCH_OAUTH_BASE_URL;
const TWITCH_API_BASE_URL = process.env.TWITCH_API_BASE_URL;
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
const TWITCH_REDIRECT_URI = process.env.TWITCH_REDIRECT_URI;


class TwitchAPIService {

    async verifyCode(code) {

        const requestData = {
            url: `${TWITCH_OAUTH_BASE_URL}/oauth2/token?client_id=${TWITCH_CLIENT_ID}&client_secret=${TWITCH_CLIENT_SECRET}&code=${code}&grant_type=authorization_code&redirect_uri=${TWITCH_REDIRECT_URI}`,
            method: 'POST'
        };

        let token;

        await axios.post(requestData.url)
            .then((response) => {

                token = response.data.access_token;

            })
            .catch((error) => {
                console.error('Cannot get request token from Twitch:', error);
                throw new BadGatewayError('Not a valid user.');
            });

        return token;
    }

    async getUserEmail(access_token) {

        const tokenData = {
            url: `${TWITCH_API_BASE_URL}/helix/users`,
            method: 'GET',
            headers: {
                'Client-ID': TWITCH_CLIENT_ID,
                'Accept': 'application/vnd.twitchtv.v5+json',
                'Authorization': 'Bearer ' + access_token
            }
        };

        let email;

        await axios(tokenData)
            .then((userData) => {

                email = userData.data.data[0].email;


            }).catch((error) => {
                console.error('Cannot get user details from Twitch: ');
                throw new BadGatewayError('Cannot get user details from Twitch');
            });

        return email;
    }

}

const instance = new TwitchAPIService();
module.exports = instance;
