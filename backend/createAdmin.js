const readline = require("readline");
const bcrypt = require("bcryptjs");
const db = require("./db/connection");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function ask(question) {
    return new Promise(resolve => {
        rl.question(question, resolve);
    });
}

async function createAdmin() {
    try {
        const name = await ask("Admin name: ");
        const email = (await ask("Admin email: ")).trim().toLowerCase();
        const password = await ask("Admin password: ");

        if (!name || !email || password.length < 8) {
            console.log("Name and email are required; password must be at least 8 characters.");
            return;
        }

        const passwordHash = await bcrypt.hash(password, 10);

        db.query(
            `INSERT INTO Users
             (name, email, password_hash, role, status)
             VALUES (?, ?, ?, 'admin', 'Approved')`,
            [name.trim(), email, passwordHash],
            (err, result) => {
                if (err) {
                    if (err.code === "ER_DUP_ENTRY") {
                        console.log("This email is already registered.");
                    } else {
                        console.log("Admin creation failed:", err.message);
                    }
                } else {
                    console.log("Admin account created successfully.");
                    console.log("Admin user ID:", result.insertId);
                }

                rl.close();
                db.end();
            }
        );
    } catch (error) {
        console.log("Error:", error.message);
        rl.close();
        db.end();
    }
}

createAdmin();