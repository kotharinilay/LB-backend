const express = require('express');
const router = express.Router({mergeParams: true});

const {authFilter} = require('../../common/middlewares/AuthFilter');

const communityVideoRouter = require('./video');
const communityClipRouter = require('./clip');
const communityInfoRouter = require('./community');

router.use(authFilter);

router.use('/', communityVideoRouter);
router.use('/', communityClipRouter);
router.use('/', communityInfoRouter);

module.exports = router;
