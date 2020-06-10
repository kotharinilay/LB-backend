const express = require('express');
const router = express.Router({mergeParams: true});

const channelRouter = require('./channel');
const videoRouter = require('./video');
const clipRouter = require('./clip');
const {authFilter} = require('../../common/middlewares/AuthFilter');

router.use(authFilter);

router.use('/', clipRouter);
router.use('/', channelRouter);
router.use('/', videoRouter);

module.exports = router;
