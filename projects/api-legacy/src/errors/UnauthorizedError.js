module.exports = function UnauthorizedError(description, message) {
  Error.captureStackTrace(this, this.constructor);

  this.type = this.constructor.name;
  this.message = message || 'Unauthorized';
  this.description = description;
  this.statusCode = 401;
};

require('util').inherits(module.exports, Error);
