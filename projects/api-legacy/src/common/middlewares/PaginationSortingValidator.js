const AsyncMiddleware = require('./AsyncMiddleware');
const BadRequestError = require('../../errors/BadRequestError');
const SortOrderEnum = require('../enums/SortOrderEnum');

const validate = AsyncMiddleware(async (req, res, next) => {
  const limit = req.query.limit;
  const offset = req.query.offset;
  const sortBy = req.query.sortBy;
  const sortOrder = req.query.sortOrder;

  req.query.limit = validateInt(limit);
  req.query.offset = validateInt(offset);

  validateSortOrder(sortOrder);
  validateSortBy(sortBy, sortOrder);

  next();
});

function validateInt(value) {
  if (isNaN(value) && typeof value !== 'undefined') {
    console.error('One of input parameters is incorrect:', value);
    throw new BadRequestError('One of query parameters is incorrect');
  }

  const parsedValue = parseInt(value, 10);

  return isNaN(parsedValue) ? undefined : parsedValue;
}

function validateSortBy(sortBy, sortOrder) {
  if (sortOrder && (typeof sortBy !== 'string' || !isNaN(sortBy))) {
    console.error('SortBy query parameter must be specified:', sortBy);
    throw new BadRequestError('Sort field is incorrect');
  }
}

function validateSortOrder(value) {
  if (typeof value !== 'undefined') {
    if (typeof value !== 'string' ||
      !SortOrderEnum.hasValue(value.toLowerCase())
    ) {
      console.error('Sort order is incorrect:', value);
      throw new BadRequestError('Sort order is incorrect');
    }
  }
}

module.exports = {
    validatePagingSorting: validate
};
