const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "YOUR_MYSQL_PASSWORD",
    database: "ordercore"
});

db.connect((err) => {
    if (err) {
        console.log("Database connection failed");
        console.log(err.message);
        return;
    }

    console.log("Connected to MySQL database");
});

module.exports = db;