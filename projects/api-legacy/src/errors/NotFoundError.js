module.exports = function NotFoundError(description, message) {
  Error.captureStackTrace(this, this.constructor);

  this.type = this.constructor.name;
  this.message = message || 'The requested resource couldn\'t be found';
  this.description = description;
  this.statusCode = 404;
};

require('util').inherits(module.exports, Error);
