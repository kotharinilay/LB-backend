const express = require('express');
const router = express.Router();

const validator = require('validator');

const EmailSenderService = require('../services/email/EmailSenderService');
const AsyncMiddleware = require('../common/middlewares/AsyncMiddleware');
const SuccessResponse = require('../common/SuccessResponse');
const BadRequestError = require('../errors/BadRequestError');
const ConflictError = require('../errors/ConflictError');
const BetaUser = require('../models/betaUser');

router.post('/users', AsyncMiddleware(async (req, res) => {
  const email = req.body.email;

  if (!validator.isEmail(email)) {
    console.error('Incorrect email provided:', email);
    throw new BadRequestError('Email is incorrect');
  }


  const user = await BetaUser.getByEmail(email);
  if (user) {
    console.warn('User already added to beta:', email);
    throw new ConflictError('User already exist');
  }

  const data = {
    email: email
  };

  await BetaUser.create(data);

  await EmailSenderService.onBetaUserSignup(email);

  const responseBody = new SuccessResponse().build();
  res.json(responseBody);
}));

module.exports = router;
