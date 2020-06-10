const request = require('request');

const gameNameToIdMapping = {
    'fortnite': 33214
};

module.exports = {

    getTopStream: function (twitchGame, callback) {

        let gameId = gameNameToIdMapping[twitchGame.toLowerCase()],
            options = {
                method: 'GET',
                url: 'https://api.twitch.tv/helix/streams',
                qs: {
                    game_id: gameId,
                    language: 'en',
                    first: 1
                },
                headers:
                    {
                        'cache-control': 'no-cache',
                        'Client-ID': '3a4o5jwg0l5bo3a0njv3a6tpuljn5x'
                    }
            };

        request(options, function (error, response, body) {
            let responseJson = JSON.parse(body),
                topStream = {};

            if (error) {
                console.error('Error on getting top stream:', error);
            } else {
                let topStreamJson = responseJson.data[0];

                topStream = {
                    'game': twitchGame,
                    'followers': 1,
                    'uri': 'https://twitch.tv/' + topStreamJson.user_name.toLowerCase(),
                    'streamer': topStreamJson.user_name,
                    'views': topStreamJson.viewer_count,
                    'title': topStreamJson.title
                }
            }

            callback(topStream)
        });
    }
};