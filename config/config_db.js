const db = require('mysql2/promise');

const dbConnection = db.createPool({
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pollos_max',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
});

module.exports = dbConnection;