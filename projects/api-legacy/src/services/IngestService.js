const axios = require('axios');

const INGEST_SERVICE_URL = 'https://ingest.wizardlabs.gg:8443/api/v1/ingest';
const BASIC_AUTH_KEY = 'a4fe1d8d8b164c7b9ccdd49b287d9332';

class IngestService {
  async scheduleJob(jobData) {

  	if (jobData["clientID"]) {
  		jobData["client_id"] = jobData["clientID"];
  	}

  	if (jobData["gameName"]) {
  		jobData["game_name"] = jobData["gameName"];
  	}

  	if (jobData["streamerName"]) {
  		jobData["streamer_name"] = jobData["streamerName"];
  	}

  	console.log("Sending Ingest Job: ")
  	
  	console.log(jobData)

    return axios.post(INGEST_SERVICE_URL, jobData, {
      headers: {Authorization: `Basic ${BASIC_AUTH_KEY}`}
    });
  }
}

const instance = new IngestService();
module.exports = instance;
