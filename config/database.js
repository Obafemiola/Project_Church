const mysql = require('mysql2');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000, // 10 seconds
    acquireTimeout: 10000, // 10 seconds
    timeout: 10000, // 10 seconds
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Convert pool to use promises
const promisePool = pool.promise();

module.exports = promisePool; 