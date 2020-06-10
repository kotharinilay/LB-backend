const pgPromise = require('pg-promise')({});

// Fix for Postgres "Timestamp without timezone" type.
// This leave value as string, not convert to Date type.
// With default conversion server timezone offset add to value from DB
pgPromise.pg.types.setTypeParser(1114, (stringValue) => {
  return stringValue;
});

const connection = {
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_LOGIN,
  password: process.env.DB_PASSWORD
};
const db = pgPromise(connection);

module.exports = {
  db: db,
  pgp: pgPromise
};
