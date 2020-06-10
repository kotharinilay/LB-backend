const {google} = require('googleapis');
const axios = require('axios');

const GOOGLE_OAUTH_BASE_URL = process.env.GOOGLE_OAUTH_BASE_URL;
const GOOGLE_OAUTH_CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const GOOGLE_OAUTH_CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const GOOGLE_OAUTH_REDIRECT_URI = process.env.GOOGLE_OAUTH_REDIRECT_URI;


class GoogleAPIService {

    async verifyCode(code) {

       
         const auth = createConnection();
        
         const data = await auth.getToken(code);
         const tokens = data.tokens;


         const tokenData = {
            url: `${GOOGLE_OAUTH_BASE_URL}/v1/userinfo`,
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + tokens.access_token
            }
        };

        let email;

        await axios(tokenData)
            .then((userData) => {


                email = userData.data.email;


            }).catch((error) => {
                console.error('Cannot get user details from Twitch: ');
                throw new BadGatewayError('Cannot get user details from Twitch');
            });

        return email;
 
    }


}

function createConnection() {
    return new google.auth.OAuth2(
        GOOGLE_OAUTH_CLIENT_ID,
        GOOGLE_OAUTH_CLIENT_SECRET,
        GOOGLE_OAUTH_REDIRECT_URI
    );
  }

const instance = new GoogleAPIService();
module.exports = instance;
