module.exports = function BadGatewayError(description, message) {
  Error.captureStackTrace(this, this.constructor);

  this.type = this.constructor.name;
  this.message = message || 'Bad gateway';
  this.description = description;
  this.statusCode = 502;
};

require('util').inherits(module.exports, Error);
