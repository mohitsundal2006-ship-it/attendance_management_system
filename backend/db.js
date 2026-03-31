const mysql = require('mysql2/promise');
require('dotenv').config({ quiet: true });

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
    queueLimit: 0
});

async function testConnection() {
    const connection = await pool.getConnection();
    try {
        await connection.ping();
        console.log('Connected to MySQL database successfully.');
    } finally {
        connection.release();
    }
}

module.exports = {
    pool,
    testConnection
};
