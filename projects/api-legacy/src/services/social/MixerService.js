const qs = require('qs');
const Mixer = require('@mixer/client-node');

const ProvidersEnum = require('../../common/enums/ProvidersEnum');

const axios = require('axios');
/* global -Promise */
const Promise = require('bluebird');

const CLIENT_ID = process.env.MIXER_OAUTH_CLIENT_ID;
const client = new Mixer.Client(new Mixer.DefaultRequestRunner());
client.use(new Mixer.OAuthProvider(client, {
  clientId: CLIENT_ID,
}));

const ProviderVideoTypeEnum = require('../../common/enums/ProviderVideoTypeEnum');
const getRedisClient = require('../redis/redisClient');

const MIXER_GAME_ID_FORTNITE = 70323
const MIXER_GAME_ID_VALORANT = 573566
const MIXER_GAME_ID_WARZONE = 568925

class MixerService {

  constructor() {
    this.redisClient = getRedisClient();
    this.MIXER_GAME_ID_FORTNITE = MIXER_GAME_ID_FORTNITE;
    this.MIXER_GAME_ID_VALORANT = MIXER_GAME_ID_VALORANT;
    this.MIXER_GAME_ID_WARZONE = MIXER_GAME_ID_WARZONE;
  }

  getGameIdFortnite() {
    return MIXER_GAME_ID_FORTNITE
  }

  getGameIdValorant() {
    return MIXER_GAME_ID_VALORANT
  }

  getGameIdWarzone() {
    return MIXER_GAME_ID_WARZONE
  }

  async getVideos(channelName, pagingSorting = {limit: DEFAULT_LIMIT}) {
    return this._getVideos(channelName);
  }

  async _getVideos(channelName,pageNum=1) {

    // grab the channel id

    return client.request('GET', `channels/${channelName}`)
      .then((response) => {

        const channelData = response.body;

        console.log(channelData["id"])

        return client.request('GET', `channels/${channelData['id']}/recordings`,{
          qs: {
            order: "createdAt:DESC",
            where: `typeId:in:${MIXER_GAME_ID_FORTNITE};${MIXER_GAME_ID_VALORANT};${MIXER_GAME_ID_WARZONE}`
          }
        })
          .then((response) => {
            
            const data = [];

            var thumbnail = "";
            var vodUrl = "";
            var videoUrl = "https://mixer.com/recording/";

            // console.log(response.body)

            var i;
            for (i=0; i<response.body.length; i++) {

              var stream = response.body[i];

              // console.log(stream)

              if (stream['state'] != "AVAILABLE"){
                continue;
              }

              var j;
              for (j=0; j < stream["vods"].length; j++){
                var vod = stream["vods"][j];
                if (vod["format"] == "thumbnail"){
                  thumbnail = vod["baseUrl"] + "source.png";
                } else if (vod["format"] == "hls") {
                  vodUrl = vod["baseUrl"] + "manifest.m3u8";
                }
              }

              data.push({
                id: stream["id"],
                gameId: stream["typeId"],
                title: stream["name"],
                description: "",
                duration: stream["duration"].toString().toHHMMSS(),
                publishedDate: stream["createdAt"],
                thumbnailUrl: thumbnail,
                videoUrl: videoUrl + stream["id"],
                providerType: ProvidersEnum.mixer,
                url: vodUrl,
                type: ProviderVideoTypeEnum.archive,
                streamerName: channelName,
                isLive: false
              })
            }

            // console.log(data)

            return data;
          })
          .catch((error) => {
            console.error('Error occurred while perform channel search in Mixer', error);
            return [];
          });
      
      })
      .catch((error) => {
        console.log("Error Looking up the Channel in Mixer", error);
        return [];
      });
  }

  async getByRecordingId(recordingId) {

    return client.request('GET', `recordings/${recordingId}`,{
      qs: {
        
      }
    })
      .then((response) => {

        // console.log(response.body);

        var thumbnail = "";
        var vodUrl = "";
        var videoUrl = "https://mixer.com/recording/";

        var stream = response.body;

        var j;
        for (j=0; j < stream["vods"].length; j++){
          var vod = stream["vods"][j];
          if (vod["format"] == "thumbnail"){
            thumbnail = vod["baseUrl"] + "source.png";
          } else if (vod["format"] == "hls") {
            vodUrl = vod["baseUrl"] + "manifest.m3u8";
          }
        }

        return {
          id: stream["id"],
          title: stream["name"],
          description: "",
          duration: stream["duration"].toString().toHHMMSS(),
          publishedDate: stream["createdAt"],
          thumbnailUrl: thumbnail,
          videoUrl: videoUrl + stream["id"],
          providerType: ProvidersEnum.mixer,
          url: vodUrl,
          type: ProviderVideoTypeEnum.archive,
          streamerName: stream["channel"]["token"],
          isLive: false
        };

      })
      .catch((error) => {
        console.error('Error occured while trying to load a stream from Mixer', error);
        return [];
      });

  }

  // async getLiveStreams(userId) {
  //   const url = buildGetLiveStreamsUrl(userId);

  //   return new Promise((resolve, reject) => {
  //     this.redisClient.get(url, function(err, response) {
  //       if (err) {
  //         reject(err);
  //       } else {
  //         resolve(response);
  //       }
  //     });
  //   })
  //     .then((response) => {
  //       if (response) {
  //         return JSON.parse(response);
  //       }

  //       return this._getLiveStreams(url);
  //     })
  //     .catch((err) => {
  //       console.error(
  //         'Error occured attempting to access redis data during MIXERService.getLiveStreams',
  //         err
  //       );

  //       return this._getLiveStreams(url);
  //     });
  // }

  // async _getLiveStreams(url) {
  //   const config = {
  //     headers: {
  //       'Client-ID': CLIENT_ID
  //     }
  //   };

  //   return axios
  //     .get(url, config)
  //     .then((response) => {
  //       const videos = response.data.data;
  //       const returnData = videos.map((video) => {
  //         return convertLiveStreamDataModel(video);
  //       });

  //       this.setDataInRedis(
  //         url,
  //         returnData,
  //         MIXER_LIVE_CACHE_TIME_SECONDS
  //       );

  //       return returnData;
  //     })
  //     .catch((error) => {
  //       console.error(
  //         'Error occurred while perform LIVE video listing from MIXER',
  //         error
  //       );
  //       return [];
  //     });
  // }

  setDataInRedis(key, data, expiration, errMsg) {
    return this.redisClient.set(
      key,
      JSON.stringify(data),
      'EX',
      expiration,
      function(err) {
        if (err) {
          console.error(errMsg ? errMsg : '', err);
        }

        return data;
      }
    );
  }
}

String.prototype.toHHMMSS = function () {
    var sec_num = parseInt(this, 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = hours;}
    if (minutes < 10) {minutes = minutes;}
    if (seconds < 10) {seconds = seconds;}
    return hours+':'+minutes+':'+seconds;
}

const instance = new MixerService();
module.exports = instance;
