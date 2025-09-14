import mysql from 'mysql2/promise';

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,          // your MySQL username
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

export default db;
