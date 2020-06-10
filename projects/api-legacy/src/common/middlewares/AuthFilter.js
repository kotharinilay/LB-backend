const AsyncMiddleware = require('./AsyncMiddleware');
const AuthenticationService = require('../../services/AuthenticationService');
const UnauthorizedError = require('../../errors/UnauthorizedError');

// This key is used for the thumbnail microservice
const VIDEO_ENGINE_API_BASIC_AUTH_KEY = 'xnVGmVw0rVbOeAQfBeSdPcv5Umz52U';
// This key is used for inter-service communication behind a VPC
const BASIC_AUTH_KEY = process.env.BASIC_AUTH_KEY;

function parseHeader(authHeader, req) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('Incorrect header for authorization: ', authHeader);
    console.error('Incorrect header for authorization path: ', req.originalUrl);
    throw new UnauthorizedError('Access token incorrect or not provided');
  }

  return authHeader.split('Bearer ')[1];
}

const authFilter = AsyncMiddleware(async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Basic ')
  ) {
    const basicToken = req.headers.authorization.split('Basic ')[1];
    if (
      basicToken === VIDEO_ENGINE_API_BASIC_AUTH_KEY ||
      basicToken === BASIC_AUTH_KEY
    ) {
      next();
      return;
    } else {
      console.warn('Strange Auth header:', req.headers.authorization);
    }
  }

  const token = parseHeader(req.headers.authorization, req);
  const parsedToken = AuthenticationService.verifyToken(token);

  req.userId = parsedToken.sub;
  next();
});

const authPresenceFilter = AsyncMiddleware(async (req, res, next) => {
  parseHeader(req.headers.authorization, req);
  next();
});

module.exports = {
    authFilter: authFilter,
    authPresenceFilter: authPresenceFilter
};