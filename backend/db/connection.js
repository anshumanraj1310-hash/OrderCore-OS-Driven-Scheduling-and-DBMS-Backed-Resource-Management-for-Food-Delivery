const mysql = require("mysql2");

const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : "",
    database: process.env.DB_NAME || "ordercore",
    multipleStatements: true
});

db.connect((err) => {
    if (err) {
        console.log("Database connection failed:", err.message);
        console.log("Please ensure MySQL is running and database 'ordercore' exists.");
        return;
    }

    console.log("Connected to MySQL database:", process.env.DB_NAME || "ordercore");
});

module.exports = db;