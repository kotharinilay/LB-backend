const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const moment = require('moment');

const UnauthorizedError = require('../errors/UnauthorizedError');
const BadRequestError = require('../errors/BadRequestError');
const NotFoundError = require('../errors/NotFoundError');
const ConflictError = require('../errors/ConflictError');
const UserStatusEnum = require('../common/enums/UserStatusEnum');
const UserService = require('../services/UserService');
const User = require('../models/user');
const PasswordReset = require('../models/passwordReset');
const UserCommunityMember = require('../models/userCommunityMember');
const EmailSenderService = require('./email/EmailSenderService');
const UserDefaultSettingsProvider = require('./user/UserDefaultSettingsProvider');
const TwitchAPIService = require('./TwitchAPIService');
const GoogleAPIService = require('./GoogleAPIService');
const DiscordAPIService = require('./DiscordAPIService');
const InstagramAPIService = require('./InstagramAPIService');

const IN_BETA = process.env.IN_BETA || true;
const DEFAULT_COMMUNITIES_IDS = [9];
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
const PASSWORD_SALT = process.env.PASSWORD_SALT;
const PASSWORD_RESET_LIFETIME_SECONDS = 24 * 60 * 60;


class AuthenticationService {
  async register(credentials = {}) {

    let { email, password } = credentials;
    let id;


    if (credentials && credentials.type) {

      if (credentials.type === "twitch") {

        let access_token = await TwitchAPIService.verifyCode(credentials.code);

        email = await TwitchAPIService.getUserEmail(access_token);


      } else if (credentials.type === "google") {


        email = await GoogleAPIService.verifyCode(credentials.code);

      } else if (credentials.type === "discord") {


        email = await DiscordAPIService.verifyCode(credentials.code);

      } else if (credentials.type === "instagram") {


        id = await InstagramAPIService.verifyCode(credentials.code);

      } else {

        throw new BadRequestError('Signup type not supported');

      }

    }

    let userId;

    if (email) {
      const existingUser = await User.getByEmail(email.toLowerCase());

      if (existingUser) {
        console.error('Cannot register user, because email already exists:',
          email);
        throw new BadRequestError('User with this email already exists');
      }

      const generatedPassword = password ?
        generatePasswordHash(password) :
        undefined;

      userId = await createUser(email, generatedPassword);
      
    } else if(id){

      const existingUser = await User.getBySocialId(id, credentials.type);

      if (existingUser) {
        console.error('Cannot register user, because suer already exists:',
          email);
        throw new BadRequestError('User already exists');
      }

      userId = await createUserWithSocial(id, credentials.type);


    }else {
      userId = await createUser();
    }

    // TODO: Remove this when we have a proper system in place
    await addUserToDefaultCommunities(userId);

    const token = generateToken(userId);

    return {
      userId: userId,
      token: token
    };

  }

  async login(credentials) {

    let user, email, id;

    if (credentials && credentials.type) {

      if (credentials.type === "twitch") {

        let access_token = await TwitchAPIService.verifyCode(credentials.code);

        email = await TwitchAPIService.getUserEmail(access_token);

        user = await getUserByEmail(email, true);

      } else if (credentials.type === "google") {

        email = await GoogleAPIService.verifyCode(credentials.code);

        user = await getUserByEmail(email, true);

      } else if (credentials.type === "discord") {

        email =  await DiscordAPIService.verifyCode(credentials.code);

        user = await getUserByEmail(email, true);

      } else if (credentials.type === "instagram") {


        id = await InstagramAPIService.verifyCode(credentials.code);

        user = await getBySocialId(id, credentials.type);


      } else {

        throw new BadRequestError('Login type not supported');

      }

      // Social login. If user does not exists then create.
      if(!user && credentials.type === "instagram"){

        let userId = await createUserWithSocial(id, "instagram");   
        user = await getBySocialId(userId, "instagram");
     
      }else if(!user){

        let userId = await createUser(email, undefined);
        user = await getUserByEmail(email, true);

      }

    } else {

      const { email, password } = credentials;
      user = await getUserByEmail(email);

      if (!user.password) {
        console.error(
          'Cannot login user, because he do not have password:', email
        );
        throw new BadRequestError('User do not have password');
      }


      try {
        validatePassword(password, user.password);
      } catch (error) {
        console.error('User provided incorrect password. UserId:', user.id);
        throw error;
      }

    }

    const token = generateToken(user.id);

    return {
      userId: user.id,
      token: token
    };


  }

  getCredentials(userId) {
    const token = generateToken(userId);

    return {
      userId: userId,
      token: token
    };
  }

  async refreshToken(token) {
    const decoded = this.verifyToken(token, true);

    return generateToken(decoded.sub);
  }

  verifyToken(token, ignoreExpiration = false) {
    const options = {
      ignoreExpiration: ignoreExpiration
    };

    try {
      return jwt.verify(token, JWT_SECRET_KEY, options);
    } catch (error) {
      let message = 'Token is invalid';
      if (error.name === 'TokenExpiredError') {
        message = 'Token is expired';
      }

      console.error(message, token);
      throw new UnauthorizedError(message);
    }
  }

  async resetPassword(email) {
    const user = await getUserByEmail(email);

    if (!user.password) {
      console.error('User cannot reset password because he do not have it:',
        user.id);
      throw new ConflictError('User not have password');
    }

    const token = generateResetToken();
    await createResetPassword(user.id, token);
    return EmailSenderService.sendPasswordRecoveryEmail(user, token);
  }

  async refreshPassword(token, password) {
    const passwordReset = await getPasswordReset(token);
    validatePasswordReset(passwordReset);

    const user = await UserService.getUser(passwordReset.user_id);
    user.password = generatePasswordHash(password);

    User.update(user, ['password']);
    await PasswordReset.delete(user.id);
  }
}

function generateToken(uuid) {
  return jwt.sign(
    {},
    JWT_SECRET_KEY,
    {
      subject: uuid.toString(),
      expiresIn: '24h'
    }
  );
}

function generatePasswordHash(password) {
  if (!password) {
    return;
  }

  return crypto.scryptSync(password, PASSWORD_SALT, 64)
    .toString('hex');
}

function validatePassword(password, passwordHash) {
  const hash = generatePasswordHash(password);

  if (hash !== passwordHash) {
    console.error('Password do not match');
    throw new UnauthorizedError('Password is incorrect');
  }
}

async function createResetPassword(userId, token) {
  return PasswordReset.create({
    token: token,
    user_id: userId
  });
}

async function getUserByEmail(email, social = false) {
  const user = await User.getByEmail(email.toLowerCase());

  if (!user & !social) {
    console.error('User not found. Email:', email);
    throw new NotFoundError('Cannot find user');
  }

  return user;
}

async function getBySocialId(id, type) {
  const user = await User.getBySocialId(id, type);

  if (!user) {
    console.error('User not found.');
    throw new NotFoundError('Cannot find user. Please signup first.');
  }

  return user;
}

async function getPasswordReset(token) {
  const passwordReset = await PasswordReset.getByToken(token);

  if (!passwordReset) {
    console.error('Token for password reset not found:', token);
    throw new NotFoundError('Token is not valid');
  }

  return passwordReset;
}

function validatePasswordReset(entity) {
  if (moment().subtract(PASSWORD_RESET_LIFETIME_SECONDS, 'seconds')
    .isAfter(entity.createdDate)
  ) {
    console.log('Token to reset password is expired:', entity);
    throw new BadRequestError('Token is expired');
  }
}

async function createUser(email, password) {
  const data = {
    settings: UserDefaultSettingsProvider.getDefault(),
    status: UserStatusEnum.registered
  };

  if (email) {
    data.email = email.toLowerCase();
  }
  if (password) {
    data.password = password;
  }

  return User.create(data);
}

async function createUserWithSocial(socialId, socialPlatform) {
  const data = {
    settings: UserDefaultSettingsProvider.getDefault(),
    status: UserStatusEnum.registered,
    socialid: socialId,
    socialplatform: socialPlatform
  };

  return User.create(data);
}

function generateResetToken() {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}

async function addUserToDefaultCommunities(userId) {
  if (IN_BETA) {
    const promises = DEFAULT_COMMUNITIES_IDS.map((communityId) => {
      return UserCommunityMember.create({
        user_id: userId,
        community_id: communityId
      });
    });

    return Promise.all(promises);
  }
}

const instance = new AuthenticationService();
module.exports = instance;
