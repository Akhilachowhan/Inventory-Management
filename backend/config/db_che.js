const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
    user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || 'Password@mysql',
    database: 'inventory_che',
    port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
    waitForConnections: true,
});

module.exports = pool;
