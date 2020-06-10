const validate = (req, res, next) => {
  const fields = req.query.fields;

  if (fields) {
    req.query.fields = new String(fields)
      .split(',')
      .map((field) => field.trim().toLowerCase())
      .filter((field) => field.length !== 0);
  }

  next();
};

module.exports = {
    validateFieldsParameter: validate
};
