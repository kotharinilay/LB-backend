const qs = require('qs');
const Mixer = require('@mixer/client-node');

const ProvidersEnum = require('../../../common/enums/ProvidersEnum');

const CLIENT_ID = process.env.MIXER_OAUTH_CLIENT_ID;
const client = new Mixer.Client(new Mixer.DefaultRequestRunner());
client.use(new Mixer.OAuthProvider(client, {
  clientId: CLIENT_ID,
}));

class MixerSearchService {
  
	async searchChannel(name) {
		
    const requestData = qs.stringify({
			query: name,
			limit: 5,
			noCount: true
		});

    return client.request('GET', `users/search?${requestData}`)
      .then((response) => {
        const users = response.body;

        return users.map((user) => {
          return convertUserDataModel(user);
        });
      })
      .catch((error) => {
        console.error('Error occurred while perform channel search in Mixer', error);
        return [];
      });
	}

  async getRecordingDetails(recordingId) {
    
    const requestData = qs.stringify({
      
    });

    return client.request('GET', `recordings/${recordingId}`)
      .then((response) => {
        const data = response.body;

        return data
      })
      .catch((error) => {
        console.error('Error occurred while trying to load recording information', error);
        return [];
      });
  }
}

function convertUserDataModel(user) {
  return {
    title: user.username,
    id: user.id,
    thumbnailUrl: user.avatarUrl,
    source: ProvidersEnum.mixer
  };
}

const instance = new MixerSearchService();
module.exports = instance;
