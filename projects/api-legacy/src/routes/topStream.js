const express = require('express');
const router = express.Router();

const twitchApi = require("../api/twitchApi");

router.get("/:game", (request, response) => {
    const game = request.params.game;

    twitchApi.getTopStream(game, (list) => {
        const returnPayload = {
            'statusCode': 200,
            'type': 'json',
            'payload': list
        };
        response.json(returnPayload)
    })
});

module.exports = router;