const express = require('express');
const router = express.Router({mergeParams: true});

const accountRouter = require('./account');
const discordRouter = require('./discord');

router.use('/discord', discordRouter);
router.use('/', accountRouter);

module.exports = router;