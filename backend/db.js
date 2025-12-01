// mysql connection module
const mysql = require("mysql2/promise");

let pool;

exports.getDB = () => {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST, // host is private EC2 IP
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectionLimit: 10
    });
  }

  return pool;
};
