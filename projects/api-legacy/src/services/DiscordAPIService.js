const axios = require('axios');
const qs = require('qs');

const BadGatewayError = require('../errors/BadGatewayError');

const DISCORD_API_ENDPOINT = process.env.DISCORD_API_ENDPOINT;
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;

class DiscordAPIService {

    async verifyCode(code) {

        const requestData = {
            url: `${DISCORD_API_ENDPOINT}/oauth2/token`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: qs.stringify({
                "client_id": DISCORD_CLIENT_ID,
                "client_secret": DISCORD_CLIENT_SECRET,
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": DISCORD_REDIRECT_URI,
                "scope": "identify email"
            })
        };

        console.log(requestData);

        let token;

        await axios(requestData)
            .then((response) => {

                token = response.data.access_token;

            })
            .catch((error) => {
                console.error('Cannot get request token from Discord:', error);
                throw new BadGatewayError('Not a valid user.');
            });

            console.log(token)
        let email;

        const tokenData = {
            url: `${DISCORD_API_ENDPOINT}/users/@me`,
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        };

        await axios(tokenData)
            .then((userData) => {

                email = userData.data.email;

            }).catch((error) => {
                console.error('Cannot get user details from Discord: ');
                throw new BadGatewayError('Cannot get user details from Discord');
            });

            console.log(email)

        return email;

    }

}

const instance = new DiscordAPIService();
module.exports = instance;
