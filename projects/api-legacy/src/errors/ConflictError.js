module.exports = function ConflictError(description, message) {
  Error.captureStackTrace(this, this.constructor);

  this.type = this.constructor.name;
  this.message = message || 'Conflict';
  this.description = description;
  this.statusCode = 409;
};

require('util').inherits(module.exports, Error);
