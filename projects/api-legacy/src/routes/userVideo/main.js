const express = require('express');
const router = express.Router({mergeParams: true});

const videoRouter = require('./video');
const overlayRouter = require('./overlay');
const bumperRouter = require('./bumper');
const {authFilter} = require('../../common/middlewares/AuthFilter');

router.use(authFilter);

router.use('/overlays', overlayRouter);
router.use('/bumpers', bumperRouter);
router.use('/', videoRouter);

module.exports = router;