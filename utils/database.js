// Import mysql module
const mysql = require('mysql2/promise');

// Set up database connection
const database = mysql.createPool({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_SCHEMA,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Export the database connection
module.exports = database;