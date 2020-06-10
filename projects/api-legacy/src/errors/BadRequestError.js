module.exports = function BadRequestError(description, message) {
  Error.captureStackTrace(this, this.constructor);

  this.type = this.constructor.name;
  this.message = message || 'Bad request';
  this.description = description;
  this.statusCode = 400;
};

require('util').inherits(module.exports, Error);
