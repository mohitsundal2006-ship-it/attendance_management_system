const sql = require('mssql/msnodesqlv8');
require('dotenv').config({ quiet: true });

const config = {
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    driver: 'SQL Server',
    options: {
        trustedConnection: true, // Enables Windows Authentication
        trustServerCertificate: true
    }
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('Connected to MSSQL Database successfully!');
        return pool;
    })
    .catch(err => console.log('Database Connection Failed! Bad Config: ', err));

module.exports = {
    sql, poolPromise
};
