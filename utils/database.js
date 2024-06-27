// Import mysql module
const mysql = require('mysql2/promise'); // Notice mysql2/promise import

// Set up database connection
const database = mysql.createPool({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD, // replace 'your_password' with your actual root password
    database: process.env.DATABASE_SCHEMA
});

// Export the database connection
module.exports = database;
