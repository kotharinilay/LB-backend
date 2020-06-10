const axios = require('axios');
const qs = require('qs');

const BadGatewayError = require('../errors/BadGatewayError');

const INSTAGRAM_OAUTH_API_ENDPOINT = process.env.INSTAGRAM_OAUTH_API_ENDPOINT ;
const INSTAGRAM_GRAPH_API_ENDPOINT = process.env.INSTAGRAM_GRAPH_API_ENDPOINT ;
const INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID ;
const INSTAGRAM_CLIENT_SECRET =  process.env.INSTAGRAM_CLIENT_SECRET ;
const INSTAGRAM_REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI ;

class InstagramAPIService {

    async verifyCode(code) {

        const requestData = {
            url: `${INSTAGRAM_OAUTH_API_ENDPOINT}/oauth/access_token`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: qs.stringify({
                "client_id": INSTAGRAM_CLIENT_ID,
                "client_secret": INSTAGRAM_CLIENT_SECRET,
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": INSTAGRAM_REDIRECT_URI
            })
        };

        console.log(requestData);

        let token;

        await axios(requestData)
            .then((response) => {

                token = response.data.access_token;

            })
            .catch((error) => {
                console.error('Cannot get request token from INSTAGRAM:', error);
                throw new BadGatewayError('Not a valid user.');
            });

        
        console.log(token);
        // return token;

        let id;

        const tokenData = {
            url: `${INSTAGRAM_GRAPH_API_ENDPOINT}/me?access_token=${token}`,
            method: 'GET'
        };

        await axios(tokenData)
            .then((userData) => {

                console.log(userData.data);
                id = userData.data.id;

            }).catch((error) => {
                console.error('Cannot get user details from INSTAGRAM: ');
                console.log(error);
                throw new BadGatewayError('Cannot get user details from INSTAGRAM');
            });

            console.log(id)

        return id;

    }

}

const instance = new InstagramAPIService();
module.exports = instance;
