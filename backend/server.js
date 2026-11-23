require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");
const path = require("path");

const db = require("./db/connection");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const app = express();

const PORT = 3000;
// Prevent simultaneous dispatches for the same restaurant.
const dispatchLocks = new Set();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));
// Authentication helpers
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is missing from the .env file");
}

function generateToken(user) {
    return jwt.sign(
        {
            user_id: user.user_id,
            name: user.name,
            email: user.email,
            role: user.role,
            customer_id: user.customer_id,
            restaurant_id: user.restaurant_id,
            agent_id: user.agent_id,
            status: user.status || "Approved"
        },
        JWT_SECRET,
        { expiresIn: "1d" }
    );
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Login required."
        });
    }

    const token = authHeader.split(" ")[1];

    jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
        if (err) {
            return res.status(403).json({
                message: "Invalid or expired token."
            });
        }

        // Live check against DB to verify status (block Pending/Rejected) and sync IDs
        db.query(
            "SELECT user_id, name, email, role, customer_id, restaurant_id, agent_id, status FROM Users WHERE user_id = ?",
            [decodedUser.user_id],
            (dbErr, rows) => {
                if (dbErr || rows.length === 0) {
                    if (decodedUser.status && decodedUser.status !== "Approved") {
                        return res.status(403).json({
                            message: `Account is ${decodedUser.status}. Access denied.`
                        });
                    }
                    req.user = decodedUser;
                    return next();
                }

                const liveUser = rows[0];
                if (liveUser.status !== "Approved") {
                    return res.status(403).json({
                        message: `Account status is ${liveUser.status}. Please await administrator approval.`
                    });
                }

                req.user = {
                    ...decodedUser,
                    name: liveUser.name,
                    email: liveUser.email,
                    role: liveUser.role,
                    customer_id: liveUser.customer_id || decodedUser.customer_id,
                    restaurant_id: liveUser.restaurant_id || decodedUser.restaurant_id,
                    agent_id: liveUser.agent_id || decodedUser.agent_id,
                    status: liveUser.status
                };
                next();
            }
        );
    });
}

function authorizeRoles(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                message: "You do not have permission to access this resource."
            });
        }

        next();
    };
}
// Customer registration
app.post("/auth/register/customer", (req, res) => {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password || !phone || !address) {
        return res.status(400).json({
            message: "All fields are required."
        });
    }

    if (password.length < 8) {
        return res.status(400).json({
            message: "Password must be at least 8 characters."
        });
    }

    const emailValue = email.trim().toLowerCase();

    bcrypt.hash(password, 10, (hashError, passwordHash) => {
        if (hashError) {
            return res.status(500).json({
                message: "Could not secure the password."
            });
        }

        db.beginTransaction((transactionError) => {
            if (transactionError) {
                return res.status(500).json({
                    message: "Could not start registration."
                });
            }

            db.query(
                `INSERT INTO Customer (name, phone, address)
                 VALUES (?, ?, ?)`,
                [name.trim(), phone.trim(), address.trim()],
                (customerError, customerResult) => {
                    if (customerError) {
                        return db.rollback(() => {
                            res.status(500).json({
                                message: "Could not create customer."
                            });
                        });
                    }

                    const customerId = customerResult.insertId;

                    db.query(
                        `INSERT INTO Users
                         (name, email, password_hash, role, customer_id, status)
                         VALUES (?, ?, ?, 'customer', ?, 'Approved')`,
                        [
                            name.trim(),
                            emailValue,
                            passwordHash,
                            customerId
                        ],
                        (userError, userResult) => {
                            if (userError) {
                                return db.rollback(() => {
                                    res.status(
                                        userError.code === "ER_DUP_ENTRY"
                                            ? 409
                                            : 500
                                    ).json({
                                        message:
                                            userError.code === "ER_DUP_ENTRY"
                                                ? "Email is already registered."
                                                : "Could not create account."
                                    });
                                });
                            }

                            db.commit((commitError) => {
                                if (commitError) {
                                    return db.rollback(() => {
                                        res.status(500).json({
                                            message: "Registration failed."
                                        });
                                    });
                                }

                                const user = {
                                    user_id: userResult.insertId,
                                    name: name.trim(),
                                    email: emailValue,
                                    role: "customer",
                                    customer_id: customerId,
                                    restaurant_id: null,
                                    agent_id: null,
                                    status: "Approved"
                                };

                                res.status(201).json({
                                    message: "Customer registered successfully.",
                                    token: generateToken(user),
                                    user
                                });
                            });
                        }
                    );
                }
            );
        });
    });
});

// Default seed accounts for instant demo login
const defaultSeedUsers = [
    {
        name: "System Administrator",
        email: "admin@ordercore.com",
        password_hash: "$2b$10$bARCITOZE9FqEX6b/QmLWe4c1AXBle9/DGmcEUNOlfqsoWrtQRwdq", // admin123
        role: "admin",
        customer_id: null,
        restaurant_id: null,
        agent_id: null,
        status: "Approved"
    },
    {
        name: "Tushar",
        email: "tushar@example.com",
        password_hash: "$2b$10$fJW0f9KNGvccSuFWqw9SXuut38KWL.YDg9an1POvqFsw7jSRDl3Tm", // password123
        role: "customer",
        customer_id: 1,
        restaurant_id: null,
        agent_id: null,
        status: "Approved"
    },
    {
        name: "Rahul",
        email: "rahul@example.com",
        password_hash: "$2b$10$fJW0f9KNGvccSuFWqw9SXuut38KWL.YDg9an1POvqFsw7jSRDl3Tm", // password123
        role: "customer",
        customer_id: 2,
        restaurant_id: null,
        agent_id: null,
        status: "Approved"
    },
    {
        name: "Pizza Hub Manager",
        email: "pizzahub@example.com",
        password_hash: "$2b$10$fJW0f9KNGvccSuFWqw9SXuut38KWL.YDg9an1POvqFsw7jSRDl3Tm", // password123
        role: "restaurant",
        customer_id: null,
        restaurant_id: 1,
        agent_id: null,
        status: "Approved"
    },
    {
        name: "Burger Point Manager",
        email: "burgerpoint@example.com",
        password_hash: "$2b$10$fJW0f9KNGvccSuFWqw9SXuut38KWL.YDg9an1POvqFsw7jSRDl3Tm", // password123
        role: "restaurant",
        customer_id: null,
        restaurant_id: 2,
        agent_id: null,
        status: "Approved"
    },
    {
        name: "Food Corner Manager",
        email: "foodcorner@example.com",
        password_hash: "$2b$10$fJW0f9KNGvccSuFWqw9SXuut38KWL.YDg9an1POvqFsw7jSRDl3Tm", // password123
        role: "restaurant",
        customer_id: null,
        restaurant_id: 3,
        agent_id: null,
        status: "Approved"
    },
    {
        name: "Agent A (Arun)",
        email: "agenta@example.com",
        password_hash: "$2b$10$fJW0f9KNGvccSuFWqw9SXuut38KWL.YDg9an1POvqFsw7jSRDl3Tm", // password123
        role: "delivery_agent",
        customer_id: null,
        restaurant_id: null,
        agent_id: 1,
        status: "Approved"
    },
    {
        name: "Agent B (Bikram)",
        email: "agentb@example.com",
        password_hash: "$2b$10$fJW0f9KNGvccSuFWqw9SXuut38KWL.YDg9an1POvqFsw7jSRDl3Tm", // password123
        role: "delivery_agent",
        customer_id: null,
        restaurant_id: null,
        agent_id: 2,
        status: "Approved"
    },
    {
        name: "Agent C (Chandan)",
        email: "agentc@example.com",
        password_hash: "$2b$10$fJW0f9KNGvccSuFWqw9SXuut38KWL.YDg9an1POvqFsw7jSRDl3Tm", // password123
        role: "delivery_agent",
        customer_id: null,
        restaurant_id: null,
        agent_id: 3,
        status: "Approved"
    },
    {
        name: "Spice Garden Manager",
        email: "spicegarden@example.com",
        password_hash: "$2b$10$fJW0f9KNGvccSuFWqw9SXuut38KWL.YDg9an1POvqFsw7jSRDl3Tm", // password123
        role: "restaurant",
        customer_id: null,
        restaurant_id: 4,
        agent_id: null,
        status: "Approved"
    },
    {
        name: "South Bite Manager",
        email: "southbite@example.com",
        password_hash: "$2b$10$fJW0f9KNGvccSuFWqw9SXuut38KWL.YDg9an1POvqFsw7jSRDl3Tm", // password123
        role: "restaurant",
        customer_id: null,
        restaurant_id: 5,
        agent_id: null,
        status: "Approved"
    },
    {
        name: "Rolls N More Manager",
        email: "rollsnmore@example.com",
        password_hash: "$2b$10$fJW0f9KNGvccSuFWqw9SXuut38KWL.YDg9an1POvqFsw7jSRDl3Tm", // password123
        role: "restaurant",
        customer_id: null,
        restaurant_id: 6,
        agent_id: null,
        status: "Approved"
    },
    {
        name: "Dessert Den Manager",
        email: "dessertden@example.com",
        password_hash: "$2b$10$fJW0f9KNGvccSuFWqw9SXuut38KWL.YDg9an1POvqFsw7jSRDl3Tm", // password123
        role: "restaurant",
        customer_id: null,
        restaurant_id: 7,
        agent_id: null,
        status: "Approved"
    }
];

function seedDefaultUser(u, callback) {
    const qWithFk = `
        INSERT INTO Users (name, email, password_hash, role, customer_id, restaurant_id, agent_id, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            password_hash = VALUES(password_hash),
            status = 'Approved',
            role = VALUES(role),
            customer_id = VALUES(customer_id),
            restaurant_id = VALUES(restaurant_id),
            agent_id = VALUES(agent_id)
    `;
    db.query(qWithFk, [u.name, u.email, u.password_hash, u.role, u.customer_id, u.restaurant_id, u.agent_id, u.status], (err) => {
        if (err) {
            // If foreign key constraint failed, insert without FK IDs
            const qFallback = `
                INSERT INTO Users (name, email, password_hash, role, customer_id, restaurant_id, agent_id, status)
                VALUES (?, ?, ?, ?, NULL, NULL, NULL, ?)
                ON DUPLICATE KEY UPDATE
                    password_hash = VALUES(password_hash),
                    status = 'Approved',
                    role = VALUES(role)
            `;
            db.query(qFallback, [u.name, u.email, u.password_hash, u.role, u.status], () => {
                if (callback) callback();
            });
        } else {
            if (callback) callback();
        }
    });
}

function ensureUsersTableAndSeeds() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS Users (
            user_id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            role ENUM('admin', 'customer', 'restaurant', 'delivery_agent') NOT NULL,
            customer_id INT NULL,
            restaurant_id INT NULL,
            agent_id INT NULL,
            status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    db.query(createTableQuery, (err) => {
        if (err) {
            console.log("Note on Users table check:", err.message);
            return;
        }

        // Schema migration: add created_at to Orders if missing
        db.query(
            "ALTER TABLE Orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
            (alterErr) => {
                if (alterErr && !alterErr.message.includes("Duplicate column")) {
                    console.log("Note on Orders.created_at migration:", alterErr.message);
                } else {
                    console.log("✓ Orders.created_at column ensured.");
                }
            }
        );

        defaultSeedUsers.forEach((u) => {
            seedDefaultUser(u);
        });
        console.log("OrderCore default demo accounts verified and ready.");
    });
}

// Endpoint to explicitly seed demo accounts
app.post("/auth/seed-users", (req, res) => {
    ensureUsersTableAndSeeds();
    res.json({ message: "Default demo accounts verified and seeded successfully." });
});

// Login for all roles
app.post("/auth/login", (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required."
        });
    }

    const emailClean = email.trim().toLowerCase();

    db.query(
        `SELECT *
         FROM Users
         WHERE email = ?`,
        [emailClean],
        (err, users) => {
            if (err) {
                return res.status(500).json({
                    message: "Database query failed: " + err.message
                });
            }

            // If user not found, check if it is one of our default demo accounts
            if (users.length === 0) {
                const demoUser = defaultSeedUsers.find(
                    (d) => d.email.toLowerCase() === emailClean
                );

                if (demoUser) {
                    return seedDefaultUser(demoUser, () => {
                        db.query(
                            `SELECT * FROM Users WHERE email = ?`,
                            [emailClean],
                            (retryErr, retryUsers) => {
                                if (retryErr || retryUsers.length === 0) {
                                    return res.status(401).json({
                                        message: `Account "${emailClean}" not found. Please register or check your email.`
                                    });
                                }
                                proceedWithAuth(retryUsers[0]);
                            }
                        );
                    });
                }

                return res.status(401).json({
                    message: `No account found with email "${emailClean}". Please check the email or sign up for a new account.`
                });
            }

            proceedWithAuth(users[0]);

            function proceedWithAuth(user) {
                bcrypt.compare(password, user.password_hash, (compareError, match) => {
                    if (compareError || !match) {
                        return res.status(401).json({
                            message: "Invalid password for this account. Note: Demo password is 'password123' (or 'admin123' for admin)."
                        });
                    }

                    // Check role match
                    if (role && user.role !== role) {
                        return res.status(403).json({
                            message: `Account role mismatch: "${user.email}" is registered as a ${user.role.toUpperCase()}, but you are logging into the ${role.toUpperCase()} module. Please use the ${user.role} portal.`
                        });
                    }

                    if (user.status !== "Approved") {
                        return res.status(403).json({
                            message: `Account is ${user.status}. Please wait for Administrator approval in the Admin portal.`
                        });
                    }

                    res.json({
                        message: "Login successful.",
                        token: generateToken(user),
                        user: {
                            user_id: user.user_id,
                            name: user.name,
                            email: user.email,
                            role: user.role,
                            customer_id: user.customer_id,
                            restaurant_id: user.restaurant_id,
                            agent_id: user.agent_id
                        }
                    });
                });
            }
        }
    );
});
// Restaurant registration
app.post("/auth/register/restaurant", (req, res) => {
    const { name, email, password, location } = req.body;

    if (!name || !email || !password || !location) {
        return res.status(400).json({
            message: "All fields are required."
        });
    }

    if (password.length < 8) {
        return res.status(400).json({
            message: "Password must be at least 8 characters."
        });
    }

    bcrypt.hash(password, 10, (hashError, passwordHash) => {
        if (hashError) {
            return res.status(500).json({
                message: "Could not secure the password."
            });
        }

        db.beginTransaction((transactionError) => {
            if (transactionError) {
                return res.status(500).json({
                    message: "Could not start registration."
                });
            }

            db.query(
                "INSERT INTO Restaurant (name, location) VALUES (?, ?)",
                [name.trim(), location.trim()],
                (restaurantError, restaurantResult) => {
                    if (restaurantError) {
                        return db.rollback(() => {
                            res.status(500).json({
                                message: "Could not create restaurant."
                            });
                        });
                    }

                    const restaurantId = restaurantResult.insertId;

                    db.query(
                        `INSERT INTO Users
                         (name, email, password_hash, role, restaurant_id, status)
                         VALUES (?, ?, ?, 'restaurant', ?, 'Pending')`,
                        [
                            name.trim(),
                            email.trim().toLowerCase(),
                            passwordHash,
                            restaurantId
                        ],
                        (userError, userResult) => {
                            if (userError) {
                                return db.rollback(() => {
                                    res.status(
                                        userError.code === "ER_DUP_ENTRY"
                                            ? 409
                                            : 500
                                    ).json({
                                        message:
                                            userError.code === "ER_DUP_ENTRY"
                                                ? "Email is already registered."
                                                : "Could not create account."
                                    });
                                });
                            }

                            db.commit((commitError) => {
                                if (commitError) {
                                    return db.rollback(() => {
                                        res.status(500).json({
                                            message: "Registration failed."
                                        });
                                    });
                                }

                                res.status(201).json({
                                    message:
                                        "Restaurant registration submitted. Await admin approval."
                                });
                            });
                        }
                    );
                }
            );
        });
    });
});


// Delivery-agent registration
app.post("/auth/register/agent", (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            message: "Name, email, and password are required."
        });
    }

    if (password.length < 8) {
        return res.status(400).json({
            message: "Password must be at least 8 characters."
        });
    }

    bcrypt.hash(password, 10, (hashError, passwordHash) => {
        if (hashError) {
            return res.status(500).json({
                message: "Could not secure the password."
            });
        }

        db.beginTransaction((transactionError) => {
            if (transactionError) {
                return res.status(500).json({
                    message: "Could not start registration."
                });
            }

            db.query(
                "INSERT INTO Delivery_Agents (name, status) VALUES (?, 'Available')",
                [name.trim()],
                (agentError, agentResult) => {
                    if (agentError) {
                        return db.rollback(() => {
                            res.status(500).json({
                                message: "Could not create delivery agent."
                            });
                        });
                    }

                    const agentId = agentResult.insertId;

                    db.query(
                        `INSERT INTO Users
                         (name, email, password_hash, role, agent_id, status)
                         VALUES (?, ?, ?, 'delivery_agent', ?, 'Pending')`,
                        [
                            name.trim(),
                            email.trim().toLowerCase(),
                            passwordHash,
                            agentId
                        ],
                        (userError) => {
                            if (userError) {
                                return db.rollback(() => {
                                    res.status(
                                        userError.code === "ER_DUP_ENTRY"
                                            ? 409
                                            : 500
                                    ).json({
                                        message:
                                            userError.code === "ER_DUP_ENTRY"
                                                ? "Email is already registered."
                                                : "Could not create account."
                                    });
                                });
                            }

                            db.commit((commitError) => {
                                if (commitError) {
                                    return db.rollback(() => {
                                        res.status(500).json({
                                            message: "Registration failed."
                                        });
                                    });
                                }

                                res.status(201).json({
                                    message:
                                        "Delivery-agent registration submitted. Await admin approval."
                                });
                            });
                        }
                    );
                }
            );
        });
    });
});
// Get pending restaurant and delivery-agent accounts
app.get(
    "/admin/pending-users",
    authenticateToken,
    authorizeRoles("admin"),
    (req, res) => {
        db.query(
            `SELECT user_id, name, email, role, status, created_at
             FROM Users
             WHERE status = 'Pending'
             AND role IN ('restaurant', 'delivery_agent')
             ORDER BY created_at ASC`,
            (err, users) => {
                if (err) {
                    return res.status(500).json({
                        message: "Could not fetch pending accounts."
                    });
                }

                res.json(users);
            }
        );
    }
);


// Approve or reject a restaurant or delivery-agent account
app.put(
    "/admin/users/:id/status",
    authenticateToken,
    authorizeRoles("admin"),
    (req, res) => {
        const userId = Number(req.params.id);
        const { status } = req.body;

        if (!Number.isInteger(userId) || userId < 1) {
            return res.status(400).json({
                message: "Invalid user ID."
            });
        }

        if (!["Approved", "Rejected"].includes(status)) {
            return res.status(400).json({
                message: "Status must be Approved or Rejected."
            });
        }

        db.query(
            `UPDATE Users
             SET status = ?
             WHERE user_id = ?
             AND role IN ('restaurant', 'delivery_agent')
             AND status = 'Pending'`,
            [status, userId],
            (err, result) => {
                if (err) {
                    return res.status(500).json({
                        message: "Could not update account status."
                    });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({
                        message: "Pending restaurant or delivery-agent account not found."
                    });
                }

                res.json({
                    message: `Account ${status.toLowerCase()} successfully.`,
                    user_id: userId,
                    status
                });
            }
        );
    }
);

// Get all users (admin only)
app.get(
    "/admin/users",
    authenticateToken,
    authorizeRoles("admin"),
    (req, res) => {
        db.query(
            `SELECT user_id, name, email, role, customer_id, restaurant_id, agent_id, status, created_at
             FROM Users
             ORDER BY user_id ASC`,
            (err, users) => {
                if (err) {
                    return res.status(500).json({
                        message: "Could not fetch users list."
                    });
                }

                res.json(users);
            }
        );
    }
);

// Home route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
});


// Get all orders

 // Get all orders with food item details
app.get("/orders", (req, res) => {
    const query = `
    SELECT
        Orders.order_id,
        Orders.customer_id,
        Customer.name AS customer_name,
        Restaurant.name AS restaurant_name,
        Orders.restaurant_id,
        Orders.arrival_time,
        Orders.prep_time,
        Orders.delivery_time,
        Orders.priority,
        Orders.status,
        Food.name AS food_name,
        Food.price AS food_price,
        Order_Items.quantity,
        (Food.price * Order_Items.quantity) AS total_amount
    FROM Orders
    JOIN Customer
        ON Orders.customer_id = Customer.customer_id
    JOIN Restaurant
        ON Orders.restaurant_id = Restaurant.restaurant_id
    JOIN Order_Items
        ON Orders.order_id = Order_Items.order_id
    JOIN Food
        ON Order_Items.food_id = Food.food_id
    ORDER BY Orders.order_id DESC
`;

    db.query(query, (err, result) => {
        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        res.json(result);
    });
});

// Get orders belonging only to the logged-in customer
app.get(
    "/customer/orders",
    authenticateToken,
    authorizeRoles("customer"),
    (req, res) => {
        const fetchOrdersForCustomer = (cid) => {
            const query = `
                SELECT
                    Orders.order_id,
                    Orders.customer_id,
                    COALESCE(Customer.name, 'Customer') AS customer_name,
                    COALESCE(Restaurant.name, 'Restaurant') AS restaurant_name,
                    Orders.restaurant_id,
                    Orders.arrival_time,
                    Orders.prep_time,
                    Orders.delivery_time,
                    Orders.priority,
                    Orders.status,
                    Delivery.delivery_id,
                    Delivery.status AS delivery_status,
                    Delivery_Agents.agent_id,
                    Delivery_Agents.name AS agent_name,
                    COALESCE(
                        GROUP_CONCAT(DISTINCT CONCAT(Food.name, ' (x', Order_Items.quantity, ')') SEPARATOR ', '),
                        'Chef Specialty Dish (x1)'
                    ) AS food_name,
                    COALESCE(SUM(Order_Items.quantity), 1) AS quantity,
                    COALESCE(SUM(Food.price * Order_Items.quantity), 150.00) AS total_amount
                FROM Orders
                LEFT JOIN Customer ON Orders.customer_id = Customer.customer_id
                LEFT JOIN Restaurant ON Orders.restaurant_id = Restaurant.restaurant_id
                LEFT JOIN Order_Items ON Orders.order_id = Order_Items.order_id
                LEFT JOIN Food ON Order_Items.food_id = Food.food_id
                LEFT JOIN Delivery ON Orders.order_id = Delivery.order_id AND Delivery.status != 'Cancelled'
                LEFT JOIN Delivery_Agents ON Delivery.agent_id = Delivery_Agents.agent_id
                WHERE Orders.customer_id = ?
                GROUP BY 
                    Orders.order_id, Orders.customer_id, Customer.name, Restaurant.name, 
                    Orders.restaurant_id, Orders.arrival_time, Orders.prep_time, Orders.delivery_time, 
                    Orders.priority, Orders.status, Delivery.delivery_id, Delivery.status, 
                    Delivery_Agents.agent_id, Delivery_Agents.name
                ORDER BY Orders.order_id DESC
            `;

            db.query(query, [cid], (err, result) => {
                if (err) {
                    return res.status(500).json({
                        message: "Could not fetch customer orders: " + err.message
                    });
                }

                res.json(result);
            });
        };

        const customerId = req.user.customer_id;
        if (customerId) {
            return fetchOrdersForCustomer(customerId);
        }

        // Self-heal: link or create customer record for user
        db.query(
            "SELECT customer_id FROM Users WHERE user_id = ?",
            [req.user.user_id],
            (uErr, uRows) => {
                if (!uErr && uRows.length > 0 && uRows[0].customer_id) {
                    req.user.customer_id = uRows[0].customer_id;
                    return fetchOrdersForCustomer(uRows[0].customer_id);
                }

                db.query(
                    "INSERT INTO Customer (name, phone, address) VALUES (?, '9876543210', 'Dehradun')",
                    [req.user.name || "Customer"],
                    (cErr, cRes) => {
                        if (cErr) {
                            return res.status(500).json({ message: "Could not link customer profile." });
                        }
                        const newCid = cRes.insertId;
                        db.query("UPDATE Users SET customer_id = ? WHERE user_id = ?", [newCid, req.user.user_id], () => {});
                        req.user.customer_id = newCid;
                        fetchOrdersForCustomer(newCid);
                    }
                );
            }
        );
    }
);

// Live single order tracking endpoint
app.get("/orders/:id/track", authenticateToken, (req, res) => {
    const orderId = req.params.id;
    const query = `
        SELECT
            Orders.order_id,
            Orders.customer_id,
            COALESCE(Customer.name, 'Customer') AS customer_name,
            COALESCE(Customer.address, 'Dehradun') AS customer_address,
            COALESCE(Customer.phone, '9876543210') AS customer_phone,
            COALESCE(Restaurant.name, 'Restaurant') AS restaurant_name,
            COALESCE(Restaurant.location, 'Dehradun') AS restaurant_location,
            Orders.restaurant_id,
            Orders.arrival_time,
            Orders.prep_time,
            Orders.delivery_time,
            Orders.priority,
            Orders.status,
            Delivery.delivery_id,
            Delivery.status AS delivery_status,
            Delivery_Agents.agent_id,
            Delivery_Agents.name AS agent_name,
            COALESCE(
                GROUP_CONCAT(DISTINCT CONCAT(Food.name, ' (x', Order_Items.quantity, ')') SEPARATOR ', '),
                'Specialty Dish'
            ) AS food_name,
            COALESCE(SUM(Order_Items.quantity), 1) AS quantity,
            COALESCE(SUM(Food.price * Order_Items.quantity), 150.00) AS total_amount
        FROM Orders
        LEFT JOIN Customer ON Orders.customer_id = Customer.customer_id
        LEFT JOIN Restaurant ON Orders.restaurant_id = Restaurant.restaurant_id
        LEFT JOIN Order_Items ON Orders.order_id = Order_Items.order_id
        LEFT JOIN Food ON Order_Items.food_id = Food.food_id
        LEFT JOIN Delivery ON Orders.order_id = Delivery.order_id AND Delivery.status != 'Cancelled'
        LEFT JOIN Delivery_Agents ON Delivery.agent_id = Delivery_Agents.agent_id
        WHERE Orders.order_id = ?
        GROUP BY 
            Orders.order_id, Orders.customer_id, Customer.name, Customer.address, Customer.phone,
            Restaurant.name, Restaurant.location, Orders.restaurant_id, Orders.arrival_time,
            Orders.prep_time, Orders.delivery_time, Orders.priority, Orders.status,
            Delivery.delivery_id, Delivery.status, Delivery_Agents.agent_id, Delivery_Agents.name
    `;

    db.query(query, [orderId], (err, rows) => {
        if (err || !rows || rows.length === 0) {
            return res.status(404).json({ error: "Order not found." });
        }
        res.json(rows[0]);
    });
});

// Get orders belonging only to the logged-in restaurant
app.get(
    "/restaurant/orders",
    authenticateToken,
    authorizeRoles("restaurant"),
    (req, res) => {
        const restaurantId = Number(req.user.restaurant_id);

        if (!restaurantId) {
            return res.status(400).json({
                message: "Restaurant account is not linked."
            });
        }

        // Check if created_at column exists
        db.query("SHOW COLUMNS FROM Orders LIKE 'created_at'", (colErr, colRows) => {
            const hasCreatedAt = !colErr && colRows && colRows.length > 0;

            const query = `
                SELECT
                    Orders.order_id,
                    Orders.customer_id,
                    COALESCE(Customer.name, 'Customer') AS customer_name,
                    COALESCE(Customer.address, 'Dehradun') AS customer_address,
                    COALESCE(Customer.phone, '9876543210') AS customer_phone,
                    COALESCE(Restaurant.name, 'Restaurant') AS restaurant_name,
                    Orders.restaurant_id,
                    Orders.arrival_time,
                    Orders.prep_time,
                    Orders.delivery_time,
                    Orders.priority,
                    Orders.status,
                    ${hasCreatedAt ? "COALESCE(MAX(Orders.created_at), NOW()) AS created_at," : "NOW() AS created_at,"}
                    COALESCE(
                        GROUP_CONCAT(DISTINCT CONCAT(Food.name, ' (x', Order_Items.quantity, ')') SEPARATOR ', '),
                        'Chef Special Dish (x1)'
                    ) AS food_name,
                    COALESCE(SUM(Food.price * Order_Items.quantity), 150.00) AS total_amount,
                    COALESCE(SUM(Order_Items.quantity), 1) AS quantity
                FROM Orders
                LEFT JOIN Customer
                    ON Orders.customer_id = Customer.customer_id
                LEFT JOIN Restaurant
                    ON Orders.restaurant_id = Restaurant.restaurant_id
                LEFT JOIN Order_Items
                    ON Orders.order_id = Order_Items.order_id
                LEFT JOIN Food
                    ON Order_Items.food_id = Food.food_id
                WHERE Orders.restaurant_id = ?
                GROUP BY
                    Orders.order_id,
                    Orders.customer_id,
                    Customer.name,
                    Customer.address,
                    Customer.phone,
                    Restaurant.name,
                    Orders.restaurant_id,
                    Orders.arrival_time,
                    Orders.prep_time,
                    Orders.delivery_time,
                    Orders.priority,
                    Orders.status
                ORDER BY Orders.order_id DESC
            `;

            db.query(query, [restaurantId], (err, result) => {
                if (err) {
                    return res.status(500).json({
                        message: "Could not fetch restaurant orders: " + err.message
                    });
                }

                res.json(result);
            });
        });
    }
);

// Quick test order creator for testing restaurant kitchen workflow
app.post(
    "/restaurant/test-order",
    authenticateToken,
    authorizeRoles("restaurant"),
    (req, res) => {
        const restaurantId = Number(req.user.restaurant_id);
        if (!restaurantId) return res.status(400).json({ message: "Invalid restaurant account" });

        // Find a food item from this restaurant or default to 1
        db.query(
            "SELECT food_id, name, price FROM Food WHERE restaurant_id = ? LIMIT 1",
            [restaurantId],
            (foodErr, foods) => {
                const foodId = (foods && foods.length > 0) ? foods[0].food_id : 1;
                const customerId = 1;

                db.query(
                    `INSERT INTO Orders (customer_id, restaurant_id, arrival_time, prep_time, delivery_time, priority, status)
                     VALUES (?, ?, 0, 10, 15, 2, 'Waiting')`,
                    [customerId, restaurantId],
                    (orderErr, orderResult) => {
                        if (orderErr) return res.status(500).json({ error: orderErr.message });
                        const orderId = orderResult.insertId;

                        db.query(
                            `INSERT INTO Order_Items (order_id, food_id, quantity) VALUES (?, ?, 2)`,
                            [orderId, foodId],
                            () => {
                                res.status(201).json({
                                    message: `Kitchen Test Order #${orderId} created successfully!`,
                                    order_id: orderId
                                });
                            }
                        );
                    }
                );
            }
        );
    }
);
// Get one order
app.get("/orders/:id", (req, res) => {

    const orderId = req.params.id;

    const query = `
        SELECT *
        FROM Orders
        WHERE order_id = ?
    `;

    db.query(query, [orderId], (err, result) => {

        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        res.json(result);
    });
});


// Get restaurants
app.get("/restaurants", (req, res) => {

    const query = `
        SELECT *
        FROM Restaurant
    `;

    db.query(query, (err, result) => {

        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        res.json(result);
    });
});


// Get delivery agents
app.get("/agents", (req, res) => {

    const query = `
        SELECT *
        FROM Delivery_Agents
    `;

    db.query(query, (err, result) => {

        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        res.json(result);
    });
});



// OS-Driven Automatic Delivery Resource Allocation Dispatcher
function autoAssignDelivery(orderId, callback) {
    db.query(
        "SELECT delivery_id FROM Delivery WHERE order_id = ? AND status != 'Cancelled'",
        [orderId],
        (err, active) => {
            if (err || (active && active.length > 0)) {
                return callback && callback(null, null);
            }

            db.query(
                "SELECT agent_id, name FROM Delivery_Agents WHERE status = 'Available' LIMIT 1",
                (aErr, agents) => {
                    if (aErr || !agents || agents.length === 0) {
                        return callback && callback(null, null);
                    }

                    const agent = agents[0];
                    db.query(
                        "INSERT INTO Delivery (order_id, agent_id, status) VALUES (?, ?, 'Assigned')",
                        [orderId, agent.agent_id],
                        (dErr, dRes) => {
                            if (dErr) return callback && callback(dErr);

                            db.query(
                                "UPDATE Delivery_Agents SET status = 'Busy' WHERE agent_id = ?",
                                [agent.agent_id],
                                () => {}
                            );

                            return callback && callback(null, {
                                delivery_id: dRes.insertId,
                                agent_id: agent.agent_id,
                                agent_name: agent.name
                            });
                        }
                    );
                }
            );
        }
    );
}

// Update order status with role-based checks and valid transitions
app.put("/orders/:id/status", authenticateToken, (req, res) => {
    const orderId = req.params.id;
    const { status } = req.body;
    const user = req.user;

    const allowedTransitions = {
        Waiting: ["Preparing", "Cancelled"],
        Preparing: ["Ready", "Cancelled"],
        Ready: ["Out for Delivery", "Cancelled"],
        "Out for Delivery": ["Delivered", "Cancelled"],
        Delivered: [],
        Cancelled: []
    };

    if (!Object.prototype.hasOwnProperty.call(allowedTransitions, status)) {
        return res.status(400).json({
            message: "Invalid order status."
        });
    }

    db.query(
        "SELECT order_id, restaurant_id, status FROM Orders WHERE order_id = ?",
        [orderId],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            if (rows.length === 0) {
                return res.status(404).json({
                    message: "Order not found."
                });
            }

            const currentOrder = rows[0];
            const currentStatus = currentOrder.status;

            // Role-based authorization
            if (user.role === "restaurant") {
                if (Number(currentOrder.restaurant_id) !== Number(user.restaurant_id)) {
                    return res.status(403).json({
                        message: "Unauthorized: You can only update orders belonging to your kitchen."
                    });
                }
                if (!["Preparing", "Ready", "Cancelled"].includes(status)) {
                    return res.status(403).json({
                        message: "Restaurant partners can only transition orders to Preparing, Ready, or Cancelled."
                    });
                }
            } else if (user.role === "delivery_agent") {
                if (!["Out for Delivery", "Delivered"].includes(status)) {
                    return res.status(403).json({
                        message: "Delivery riders can only update orders to Out for Delivery or Delivered."
                    });
                }
            } else if (user.role === "customer") {
                if (status !== "Cancelled" || currentStatus !== "Waiting") {
                    return res.status(403).json({
                        message: "Customers can only cancel unstarted orders that are Waiting."
                    });
                }
            }

            if (currentStatus === status) {
                return res.json({
                    message: "Order already has this status.",
                    order_id: Number(orderId),
                    status
                });
            }

            if (!allowedTransitions[currentStatus]?.includes(status)) {
                return res.status(409).json({
                    message: `Cannot change order status from ${currentStatus} to ${status}.`
                });
            }

            db.query(
                `UPDATE Orders
                 SET status = ?
                 WHERE order_id = ? AND status = ?`,
                [status, orderId, currentStatus],
                (updateError, result) => {
                    if (updateError) {
                        return res.status(500).json({
                            error: updateError.message
                        });
                    }

                    if (result.affectedRows === 0) {
                        return res.status(409).json({
                            message: "Order status changed concurrently. Refresh and try again."
                        });
                    }

                    // Auto resource allocation: When order becomes Ready, assign available rider
                    if (status === "Ready") {
                        autoAssignDelivery(orderId, (assignErr, assigned) => {
                            return res.json({
                                message: "Order status updated to Ready. Delivery resource allocated.",
                                order_id: Number(orderId),
                                previous_status: currentStatus,
                                status,
                                delivery_assigned: !!assigned,
                                agent_name: assigned ? assigned.agent_name : null
                            });
                        });
                        return;
                    }

                    return res.json({
                        message: "Order status updated successfully.",
                        order_id: Number(orderId),
                        previous_status: currentStatus,
                        status
                    });
                }
            );
        }
    );
});

// Update delivery trip status (e.g. Assigned -> Out for Delivery)
app.put("/deliveries/:id/status", authenticateToken, authorizeRoles("delivery_agent", "admin"), (req, res) => {
    const deliveryId = req.params.id;
    const { status } = req.body;

    if (!["Assigned", "Out for Delivery", "Completed"].includes(status)) {
        return res.status(400).json({ error: "Invalid delivery status." });
    }

    db.query(
        "SELECT order_id, agent_id, status FROM Delivery WHERE delivery_id = ?",
        [deliveryId],
        (err, rows) => {
            if (err || rows.length === 0) {
                return res.status(404).json({ error: "Delivery not found." });
            }

            const del = rows[0];
            if (req.user.role === "delivery_agent" && req.user.agent_id && Number(del.agent_id) !== Number(req.user.agent_id)) {
                return res.status(403).json({ error: "Unauthorized: You can only update deliveries assigned to you." });
            }

            db.query(
                "UPDATE Delivery SET status = ? WHERE delivery_id = ?",
                [status, deliveryId],
                (uErr) => {
                    if (uErr) return res.status(500).json({ error: uErr.message });

                    let newOrderStatus = status;
                    if (status === "Assigned") newOrderStatus = "Ready";
                    if (status === "Out for Delivery") newOrderStatus = "Out for Delivery";
                    if (status === "Completed") newOrderStatus = "Delivered";

                    db.query(
                        "UPDATE Orders SET status = ? WHERE order_id = ?",
                        [newOrderStatus, del.order_id],
                        () => {}
                    );

                    if (status === "Completed") {
                        db.query("UPDATE Delivery_Agents SET status = 'Available' WHERE agent_id = ?", [del.agent_id], () => {});
                    }

                    res.json({
                        message: "Delivery status updated successfully.",
                        delivery_id: Number(deliveryId),
                        status,
                        order_status: newOrderStatus
                    });
                }
            );
        }
    );
});



// Assign delivery agent


app.post("/delivery", (req, res) => {
    const { order_id, agent_id } = req.body;

    if (!order_id || !agent_id) {
        return res.status(400).json({
            message: "order_id and agent_id are required."
        });
    }

    db.beginTransaction((err) => {
        if (err) {
            console.error("Transaction error:", err.message);
            return res.status(500).json({
                message: "Failed to start transaction."
            });
        }

        // Check whether the order exists and is Ready.
        db.query(
            "SELECT order_id, status FROM Orders WHERE order_id = ? FOR UPDATE",
            [order_id],
            (err, orders) => {
                if (err) return rollback("Failed to check order.");

                if (orders.length === 0) {
                    return rollback("Order not found.", 404);
                }

                if (orders[0].status !== "Ready") {
                    return rollback(
                        "Only Ready orders can be assigned for delivery.",
                        409
                    );
                }

                // Check for an existing active delivery.
                db.query(
                    `SELECT delivery_id
                     FROM Delivery
                     WHERE order_id = ?
                     AND status IN ('Assigned', 'In Transit')
                     FOR UPDATE`,
                    [order_id],
                    (err, activeDeliveries) => {
                        if (err) return rollback("Failed to check active deliveries.");

                        if (activeDeliveries.length > 0) {
                            return rollback(
                                "This order already has an active delivery.",
                                409
                            );
                        }

                        // Check whether the selected agent is available.
                        db.query(
                            `SELECT agent_id, name, status
                             FROM Delivery_Agents
                             WHERE agent_id = ?
                             FOR UPDATE`,
                            [agent_id],
                            (err, agents) => {
                                if (err) return rollback("Failed to check delivery agent.");

                                if (agents.length === 0) {
                                    return rollback("Delivery agent not found.", 404);
                                }

                                if (agents[0].status !== "Available") {
                                    return rollback(
                                        "Selected delivery agent is not available.",
                                        409
                                    );
                                }

                                // Insert the delivery.
                                db.query(
                                    `INSERT INTO Delivery (order_id, agent_id, status)
                                     VALUES (?, ?, 'Assigned')`,
                                    [order_id, agent_id],
                                    (err, result) => {
                                        if (err) return rollback("Failed to create delivery.");

                                        // Mark the agent as Busy and order as Out for Delivery.
                                        db.query(
                                            `UPDATE Delivery_Agents
                                             SET status = 'Busy'
                                             WHERE agent_id = ?`,
                                            [agent_id],
                                            (err) => {
                                                if (err) return rollback("Failed to update agent status.");

                                                db.query(
                                                    `UPDATE Orders
                                                     SET status = 'Out for Delivery'
                                                     WHERE order_id = ?`,
                                                    [order_id],
                                                    (orderUpdateErr) => {
                                                        if (orderUpdateErr) return rollback("Failed to update order status.");

                                                        db.commit((err) => {
                                                            if (err) {
                                                                return rollback("Failed to commit delivery assignment.");
                                                            }

                                                            return res.status(201).json({
                                                                message: "Delivery assigned successfully.",
                                                                delivery_id: result.insertId,
                                                                order_id,
                                                                agent_id,
                                                                agent_name: agents[0].name,
                                                                delivery_status: "Assigned",
                                                                order_status: "Out for Delivery",
                                                                agent_status: "Busy"
                                                            });
                                                        });
                                                    }
                                                );
                                            }
                                        );
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
    });

    // Roll back the transaction and send an error response.
    function rollback(message, statusCode = 500) {
        db.rollback((err) => {
            if (err) {
                console.error("Rollback failed:", err.message);
            }

            return res.status(statusCode).json({ message });
        });
    }
});

// Get deliveries
app.get("/deliveries", (req, res) => {

    const query = `
        SELECT *
        FROM Delivery
    `;

    db.query(query, (err, result) => {

        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        res.json(result);
    });
});

// Get deliveries belonging only to the logged-in delivery agent
app.get(
    "/agent/deliveries",
    authenticateToken,
    authorizeRoles("delivery_agent"),
    (req, res) => {
        const agentId = req.user.agent_id;

        if (!agentId) {
            return res.status(400).json({
                message: "Delivery agent account is not linked."
            });
        }

        const query = `
            SELECT
                Delivery.delivery_id,
                Delivery.order_id,
                Delivery.agent_id,
                Delivery.status,
                Delivery.assigned_at,
                Delivery_Agents.name AS agent_name,
                Orders.restaurant_id,
                Restaurant.name AS restaurant_name,
                Restaurant.location AS restaurant_location,
                Customer.name AS customer_name,
                Customer.address AS customer_address,
                Customer.phone AS customer_phone,
                Orders.prep_time,
                Orders.priority
            FROM Delivery
            JOIN Delivery_Agents ON Delivery.agent_id = Delivery_Agents.agent_id
            JOIN Orders ON Delivery.order_id = Orders.order_id
            JOIN Restaurant ON Orders.restaurant_id = Restaurant.restaurant_id
            JOIN Customer ON Orders.customer_id = Customer.customer_id
            WHERE Delivery.agent_id = ?
            ORDER BY Delivery.delivery_id DESC
        `;

        db.query(query, [agentId], (err, result) => {
            if (err) {
                return res.status(500).json({
                    message: "Could not fetch agent deliveries."
                });
            }

            res.json(result);
        });
    }
);

 // Optional auth helper: if bearer token provided, authenticate; if not, proceed without blocking
function optionalAuthenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next();
    }
    const token = authHeader.split(" ")[1];
    jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
        if (!err && decodedUser) {
            req.user = decodedUser;
        }
        next();
    });
}

// Complete a delivery and release its agent only when no active deliveries remain
app.put("/deliveries/:id/complete", optionalAuthenticateToken, (req, res) => {
    const deliveryId = req.params.id;

    db.beginTransaction((transactionError) => {
        if (transactionError) {
            return res.status(500).json({
                error: transactionError.message
            });
        }

        db.query(
            `SELECT order_id, agent_id, status
             FROM Delivery
             WHERE delivery_id = ?
             FOR UPDATE`,
            [deliveryId],
            (deliveryError, deliveries) => {
                if (deliveryError || deliveries.length === 0) {
                    return db.rollback(() => {
                        res.status(deliveryError ? 500 : 404).json({
                            error: deliveryError
                                ? deliveryError.message
                                : "Delivery not found"
                        });
                    });
                }

                const delivery = deliveries[0];

                // Allow completion if: admin, OR agent_id matches, OR agent_id not in JWT (fallback)
                if (req.user.role === "delivery_agent" && req.user.agent_id && Number(delivery.agent_id) !== Number(req.user.agent_id)) {
                    return db.rollback(() => {
                        res.status(403).json({
                            error: "Unauthorized: You can only complete deliveries assigned to your rider profile."
                        });
                    });
                }

                if (delivery.status === "Completed") {
                    return db.rollback(() => {
                        res.status(409).json({
                            error: "Delivery is already completed"
                        });
                    });
                }

                db.query(
                    `UPDATE Delivery
                     SET status = 'Completed'
                     WHERE delivery_id = ?`,
                    [deliveryId],
                    (updateDeliveryError) => {
                        if (updateDeliveryError) {
                            return db.rollback(() => {
                                res.status(500).json({
                                    error: updateDeliveryError.message
                                });
                            });
                        }

                        // Check whether this agent has other active deliveries
                        db.query(
                            `SELECT COUNT(*) AS activeCount
                             FROM Delivery
                             WHERE agent_id = ?
                             AND status != 'Completed'`,
                            [delivery.agent_id],
                            (countError, results) => {
                                if (countError) {
                                    return db.rollback(() => {
                                        res.status(500).json({
                                            error: countError.message
                                        });
                                    });
                                }

                                const agentStatus =
                                    results[0].activeCount === 0
                                        ? "Available"
                                        : "Busy";

                                db.query(
                                    `UPDATE Delivery_Agents
                                     SET status = ?
                                     WHERE agent_id = ?`,
                                    [agentStatus, delivery.agent_id],
                                    (updateAgentError) => {
                                        if (updateAgentError) {
                                            return db.rollback(() => {
                                                res.status(500).json({
                                                    error: updateAgentError.message
                                                });
                                            });
                                        }

                                        // Mark the corresponding order as Delivered
                                        db.query(
                                            `UPDATE Orders
                                             SET status = 'Delivered'
                                             WHERE order_id = ?`,
                                            [delivery.order_id],
                                            (orderErr) => {
                                                if (orderErr) {
                                                    return db.rollback(() => {
                                                        res.status(500).json({
                                                            error: orderErr.message
                                                        });
                                                    });
                                                }

                                                db.commit((commitError) => {
                                                    if (commitError) {
                                                        return db.rollback(() => {
                                                            res.status(500).json({
                                                                error: commitError.message
                                                            });
                                                        });
                                                    }

                                                    // Auto Dispatch queue check: check if any Ready orders need a rider
                                                    if (agentStatus === "Available") {
                                                        db.query(
                                                            `SELECT Orders.order_id 
                                                             FROM Orders 
                                                             LEFT JOIN Delivery ON Orders.order_id = Delivery.order_id AND Delivery.status != 'Cancelled'
                                                             WHERE Orders.status = 'Ready' AND Delivery.delivery_id IS NULL
                                                             ORDER BY Orders.priority ASC, Orders.order_id ASC
                                                             LIMIT 1`,
                                                            (wErr, wRows) => {
                                                                if (!wErr && wRows && wRows.length > 0) {
                                                                    autoAssignDelivery(wRows[0].order_id, () => {});
                                                                }
                                                            }
                                                        );
                                                    }

                                                    res.json({
                                                        message:
                                                            "Delivery completed successfully",
                                                        delivery_id: Number(deliveryId),
                                                        order_id: delivery.order_id,
                                                        order_status: "Delivered",
                                                        agent_id: delivery.agent_id,
                                                        agent_status: agentStatus
                                                    });
                                                });
                                            }
                                        );
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
    });
});



/* Get customers */
app.get("/customers", (req, res) => {
    db.query("SELECT * FROM Customer", (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(result);
    });
});

/* Get food items */
app.get("/food", (req, res) => {
    const query = `
        SELECT Food.food_id, Food.name, Food.price,
               Food.restaurant_id, Restaurant.name AS restaurant_name
        FROM Food
        JOIN Restaurant
            ON Food.restaurant_id = Restaurant.restaurant_id
    `;

    db.query(query, (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(result);
    });
});

/* Place a new order */
app.post(
    "/orders",
    authenticateToken,
    authorizeRoles("customer"),
    (req, res) => {

    const executeOrderPlacement = (customerId) => {
        const {
            restaurant_id,
            items,
            food_id,
            quantity,
            arrival_time,
            prep_time,
            delivery_time,
            priority
        } = req.body;

        let orderItems = [];
        if (Array.isArray(items) && items.length > 0) {
            orderItems = items.map(it => ({
                food_id: Number(it.food_id),
                quantity: Number(it.quantity) || 1
            })).filter(it => it.food_id && it.quantity > 0);
        } else if (food_id && Number(quantity) > 0) {
            orderItems = [{
                food_id: Number(food_id),
                quantity: Number(quantity)
            }];
        }

        if (!customerId || !restaurant_id || orderItems.length === 0) {
            return res.status(400).json({
                error: "Please select valid food items and quantity."
            });
        }

        const calculatedPrep = prep_time !== undefined ? prep_time : Math.min(30, 8 + (orderItems.length * 3));
        const calculatedDel = delivery_time !== undefined ? delivery_time : 15;

        const orderQuery = `
            INSERT INTO Orders
            (customer_id, restaurant_id, arrival_time, prep_time,
             delivery_time, priority, status)
            VALUES (?, ?, ?, ?, ?, ?, 'Waiting')
        `;

        db.beginTransaction((transactionError) => {
            if (transactionError) {
                return res.status(500).json({ error: transactionError.message });
            }

            db.query(orderQuery, [
                customerId,
                restaurant_id,
                arrival_time ?? 0,
                calculatedPrep,
                calculatedDel,
                priority ?? 2
            ], (orderError, orderResult) => {
                if (orderError) {
                    return db.rollback(() =>
                        res.status(500).json({ error: orderError.message })
                    );
                }

                const orderId = orderResult.insertId;
                const itemValues = orderItems.map(it => [orderId, it.food_id, it.quantity]);

                db.query(
                    `INSERT INTO Order_Items (order_id, food_id, quantity)
                     VALUES ?`,
                    [itemValues],
                    (itemError) => {
                        if (itemError) {
                            return db.rollback(() =>
                                res.status(500).json({ error: itemError.message })
                            );
                        }

                        db.commit((commitError) => {
                            if (commitError) {
                                return db.rollback(() =>
                                    res.status(500).json({ error: commitError.message })
                                );
                            }

                            res.status(201).json({
                                message: "Order placed successfully",
                                order_id: orderId,
                                items_count: orderItems.length,
                                prep_time: calculatedPrep,
                                delivery_time: calculatedDel
                            });
                        });
                    }
                );
            });
        });
    };

    if (req.user.customer_id) {
        return executeOrderPlacement(req.user.customer_id);
    }

    db.query(
        "SELECT customer_id FROM Users WHERE user_id = ?",
        [req.user.user_id],
        (uErr, uRows) => {
            if (!uErr && uRows.length > 0 && uRows[0].customer_id) {
                req.user.customer_id = uRows[0].customer_id;
                return executeOrderPlacement(uRows[0].customer_id);
            }

            db.query(
                "INSERT INTO Customer (name, phone, address) VALUES (?, '9876543210', 'Dehradun')",
                [req.user.name || "Customer"],
                (cErr, cRes) => {
                    if (cErr) {
                        return res.status(500).json({ error: "Could not initialize customer account." });
                    }
                    const newCid = cRes.insertId;
                    db.query("UPDATE Users SET customer_id = ? WHERE user_id = ?", [newCid, req.user.user_id], () => {});
                    req.user.customer_id = newCid;
                    executeOrderPlacement(newCid);
                }
            );
        }
    );
});

/* Run CPU scheduling simulation */
app.post("/schedule", (req, res) => {
    const { algorithm } = req.body;

    const allowedAlgorithms = ["FCFS", "SJF", "PRIORITY"];

    if (!allowedAlgorithms.includes(algorithm)) {
        return res.status(400).json({
            error: "Choose FCFS, SJF, or PRIORITY."
        });
    }

    const query = `
        SELECT order_id, arrival_time, prep_time, priority
        FROM Orders
        WHERE status = 'Waiting'
        ORDER BY arrival_time, order_id
    `;

    db.query(query, (err, orders) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (orders.length === 0) {
            return res.json({
                algorithm,
                orders: [],
                averageWaitingTime: 0,
                averageTurnaroundTime: 0,
                message: "No waiting orders to schedule."
            });
        }

        if (orders.length > 100) {
            return res.status(400).json({
                error: "The scheduler supports at most 100 orders."
            });
        }

        const input = [
            String(orders.length),
            ...orders.map(order => [
                order.order_id,
                order.arrival_time,
                order.prep_time,
                order.priority
            ].join(" "))
        ].join("\n") + "\n";

        const schedulerPath = path.resolve(
            __dirname, "../scheduler/scheduler_test"
        );

        const child = spawn(schedulerPath, [algorithm]);
        let stdout = "";
        let stderr = "";

        child.stdout.on("data", data => stdout += data);
        child.stderr.on("data", data => stderr += data);

        child.on("error", error => {
            if (!res.headersSent) {
                res.status(500).json({
                    error: "Could not run the C++ scheduler. Compile it first.",
                    details: error.message
                });
            }
        });

        child.on("close", code => {
            if (res.headersSent) return;

            if (code !== 0) {
                return res.status(500).json({
                    error: "The scheduler failed.",
                    details: stderr
                });
            }

            const lines = stdout.trim().split("\n");

            if (lines.length < 2) {
                return res.status(500).json({
                    error: "The scheduler returned no results."
                });
            }

            const results = lines.slice(1).map(line => {
                const values = line.split(",").map(Number);

                return {
                    order_id: values[0],
                    arrivalTime: values[1],
                    prepTime: values[2],
                    priority: values[3],
                    completionTime: values[4],
                    waitingTime: values[5],
                    turnaroundTime: values[6]
                };
            });


            const averageWaitingTime =
                results.reduce((sum, order) =>
                    sum + order.waitingTime, 0
                ) / results.length;

            const averageTurnaroundTime =
                results.reduce((sum, order) =>
                    sum + order.turnaroundTime, 0
                ) / results.length;

            res.json({
                algorithm,
                orders: results,
                averageWaitingTime: Number(averageWaitingTime.toFixed(2)),
                averageTurnaroundTime:
                    Number(averageTurnaroundTime.toFixed(2))
            });
        });

        child.stdin.end(input);
    });
});

/* Compare All 3 Scheduling Algorithms Side-by-Side (FCFS vs SJF vs PRIORITY) */
app.post("/schedule/compare", (req, res) => {
    const query = `
        SELECT order_id, arrival_time, prep_time, priority
        FROM Orders
        WHERE status = 'Waiting'
        ORDER BY arrival_time, order_id
    `;

    db.query(query, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        // If no waiting orders in DB, provide benchmark demo batch so the comparison is always demonstratable
        let ordersToSchedule = rows;
        let isDemoBatch = false;
        if (!ordersToSchedule || ordersToSchedule.length === 0) {
            isDemoBatch = true;
            ordersToSchedule = [
                { order_id: 101, arrival_time: 0, prep_time: 6, priority: 2 },
                { order_id: 102, arrival_time: 1, prep_time: 2, priority: 1 },
                { order_id: 103, arrival_time: 2, prep_time: 8, priority: 3 },
                { order_id: 104, arrival_time: 3, prep_time: 3, priority: 1 }
            ];
        }

        const algorithms = ["FCFS", "SJF", "PRIORITY"];
        const schedulerPath = path.resolve(__dirname, "../scheduler/scheduler_test");

        const input = [
            String(ordersToSchedule.length),
            ...ordersToSchedule.map(o => `${o.order_id} ${o.arrival_time} ${o.prep_time} ${o.priority}`)
        ].join("\n") + "\n";

        const runAlgo = (algo) => {
            return new Promise((resolve, reject) => {
                const child = spawn(schedulerPath, [algo]);
                let stdout = "";
                let stderr = "";

                child.stdout.on("data", d => stdout += d);
                child.stderr.on("data", d => stderr += d);

                child.on("error", reject);
                child.on("close", code => {
                    if (code !== 0) return reject(new Error(stderr || `Exited with code ${code}`));
                    const lines = stdout.trim().split("\n");
                    const parsed = lines.slice(1).map(l => {
                        const v = l.split(",").map(Number);
                        return {
                            order_id: v[0],
                            arrivalTime: v[1],
                            prepTime: v[2],
                            priority: v[3],
                            completionTime: v[4],
                            waitingTime: v[5],
                            turnaroundTime: v[6]
                        };
                    });
                    const avgWait = parsed.reduce((s, o) => s + o.waitingTime, 0) / parsed.length;
                    const avgTat = parsed.reduce((s, o) => s + o.turnaroundTime, 0) / parsed.length;
                    resolve({
                        algorithm: algo,
                        orders: parsed,
                        averageWaitingTime: Number(avgWait.toFixed(2)),
                        averageTurnaroundTime: Number(avgTat.toFixed(2))
                    });
                });

                child.stdin.end(input);
            });
        };

        Promise.all(algorithms.map(runAlgo))
            .then(results => {
                const best = results.reduce((prev, curr) =>
                    curr.averageWaitingTime < prev.averageWaitingTime ? curr : prev
                );

                res.json({
                    isDemoBatch,
                    orderCount: ordersToSchedule.length,
                    results,
                    bestAlgorithm: best.algorithm,
                    lowestAverageWaitingTime: best.averageWaitingTime,
                    summary: `Algorithm ${best.algorithm} produced the optimal CPU schedule with minimum average waiting time (${best.averageWaitingTime} mins).`
                });
            })
            .catch(simErr => {
                res.status(500).json({
                    error: "Failed to run C++ scheduler comparison.",
                    details: simErr.message
                });
            });
    });
});
// Dispatch the next order using the selected scheduling algorithm.
app.post("/schedule/dispatch", (req, res) => {
    const { algorithm, restaurant_id } = req.body;

    const allowedAlgorithms = ["FCFS", "SJF", "PRIORITY"];

    if (!allowedAlgorithms.includes(algorithm)) {
        return res.status(400).json({
            error: "Choose FCFS, SJF, or PRIORITY."
        });
    }

    if (!Number.isInteger(Number(restaurant_id)) || Number(restaurant_id) < 1) {
        return res.status(400).json({
            error: "A valid restaurant ID is required."
        });
    }

    const restaurantId = Number(restaurant_id);

    if (dispatchLocks.has(restaurantId)) {
        return res.status(409).json({
            error: "A dispatch is already in progress for this restaurant."
        });
    }

    dispatchLocks.add(restaurantId);

    function finish(statusCode, data) {
        dispatchLocks.delete(restaurantId);
        return res.status(statusCode).json(data);
    }

    // Check whether this restaurant already has an order being prepared.
    db.query(
        `SELECT order_id
         FROM Orders
         WHERE restaurant_id = ?
         AND status = 'Preparing'
         LIMIT 1`,
        [restaurantId],
        (err, activeOrders) => {
            if (err) {
                return finish(500, { error: err.message });
            }

            if (activeOrders.length > 0) {
                return finish(409, {
                    error: `Order ${activeOrders[0].order_id} is already being prepared at this restaurant.`
                });
            }

            // Fetch only Waiting orders from the selected restaurant.
            db.query(
                `SELECT order_id, arrival_time, prep_time, priority
                 FROM Orders
                 WHERE restaurant_id = ?
                 AND status = 'Waiting'
                 ORDER BY arrival_time, order_id`,
                [restaurantId],
                (queryError, orders) => {
                    if (queryError) {
                        return finish(500, { error: queryError.message });
                    }

                    if (orders.length === 0) {
                        return finish(200, {
                            message: "No waiting orders at this restaurant.",
                            dispatched: false
                        });
                    }

                    if (orders.length > 100) {
                        return finish(400, {
                            error: "The scheduler supports at most 100 orders."
                        });
                    }

                    const input = [
                        String(orders.length),
                        ...orders.map(order => [
                            order.order_id,
                            order.arrival_time,
                            order.prep_time,
                            order.priority
                        ].join(" "))
                    ].join("\n") + "\n";

                    const schedulerPath = path.resolve(
                        __dirname,
                        "../scheduler/scheduler_test"
                    );

                    const child = spawn(schedulerPath, [algorithm]);

                    let stdout = "";
                    let stderr = "";
                    let spawnFailed = false;

                    child.stdout.on("data", data => {
                        stdout += data;
                    });

                    child.stderr.on("data", data => {
                        stderr += data;
                    });

                    child.on("error", error => {
                        spawnFailed = true;

                        finish(500, {
                            error: "Could not run the C++ scheduler. Compile it first.",
                            details: error.message
                        });
                    });

                    child.on("close", code => {
                        if (spawnFailed) return;

                        if (code !== 0) {
                            return finish(500, {
                                error: "The C++ scheduler failed.",
                                details: stderr
                            });
                        }

                        const lines = stdout.trim().split("\n");

                        if (lines.length < 2) {
                            return finish(500, {
                                error: "The scheduler returned no results."
                            });
                        }

                        const values = lines[1].split(",").map(Number);

                        if (values.length !== 7 || values.some(Number.isNaN)) {
                            return finish(500, {
                                error: "Invalid output from the C++ scheduler."
                            });
                        }

                        const selectedOrderId = values[0];

                        // Change only the selected order from Waiting to Preparing.
                        db.query(
                            `UPDATE Orders
                             SET status = 'Preparing'
                             WHERE order_id = ?
                             AND restaurant_id = ?
                             AND status = 'Waiting'
                             AND NOT EXISTS (
                                 SELECT 1
                                 FROM (
                                     SELECT order_id
                                     FROM Orders
                                     WHERE restaurant_id = ?
                                     AND status = 'Preparing'
                                 ) AS active
                             )`,
                            [selectedOrderId, restaurantId, restaurantId],
                            (updateError, updateResult) => {
                                if (updateError) {
                                    return finish(500, {
                                        error: updateError.message
                                    });
                                }

                                if (updateResult.affectedRows === 0) {
                                    return finish(409, {
                                        error: "The order could not be dispatched. Refresh and try again."
                                    });
                                }

                                return finish(200, {
                                    message: `Order ${selectedOrderId} has been dispatched for preparation.`,
                                    dispatched: true,
                                    algorithm,
                                    restaurant_id: restaurantId,
                                    order: {
                                        order_id: values[0],
                                        arrivalTime: values[1],
                                        prepTime: values[2],
                                        priority: values[3],
                                        completionTime: values[4],
                                        waitingTime: values[5],
                                        turnaroundTime: values[6],
                                        status: "Preparing"
                                    }
                                });
                            }
                        );
                    });

                    child.stdin.end(input);
                }
            );
        }
    );
});

// Run C++ Deadlock Detection
app.post("/deadlock/detect", (req, res) => {
    const deadlockPath = path.resolve(__dirname, "../deadlock/deadlock_runner");
    const { allocation, request } = req.body || {};

    let args = ["simulate"];
    if (
        Array.isArray(allocation) && allocation.length === 2 &&
        Array.isArray(request) && request.length === 2
    ) {
        args = [
            "detect",
            String(allocation[0][0] ? 1 : 0),
            String(allocation[0][1] ? 1 : 0),
            String(allocation[1][0] ? 1 : 0),
            String(allocation[1][1] ? 1 : 0),
            String(request[0][0] ? 1 : 0),
            String(request[0][1] ? 1 : 0),
            String(request[1][0] ? 1 : 0),
            String(request[1][1] ? 1 : 0)
        ];
    }

    const child = spawn(deadlockPath, args);
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", data => stdout += data);
    child.stderr.on("data", data => stderr += data);

    child.on("error", (err) => {
        return res.status(500).json({
            error: "Could not run C++ deadlock runner. Make sure it is compiled.",
            details: err.message
        });
    });

    child.on("close", (code) => {
        if (code !== 0) {
            return res.status(500).json({
                error: "Deadlock runner failed.",
                details: stderr
            });
        }

        try {
            const result = JSON.parse(stdout.trim());
            return res.json(result);
        } catch (parseErr) {
            return res.status(500).json({
                error: "Failed to parse deadlock runner output.",
                raw: stdout
            });
        }
    });
});

// Run C++ Deadlock Resolution & Recovery
app.post("/deadlock/resolve", (req, res) => {
    const deadlockPath = path.resolve(__dirname, "../deadlock/deadlock_runner");
    const child = spawn(deadlockPath, ["resolve"]);
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", data => stdout += data);
    child.stderr.on("data", data => stderr += data);

    child.on("error", (err) => {
        return res.status(500).json({
            error: "Could not run C++ deadlock runner. Make sure it is compiled.",
            details: err.message
        });
    });

    child.on("close", (code) => {
        if (code !== 0) {
            return res.status(500).json({
                error: "Deadlock runner failed.",
                details: stderr
            });
        }

        try {
            const result = JSON.parse(stdout.trim());
            return res.json(result);
        } catch (parseErr) {
            return res.status(500).json({
                error: "Failed to parse deadlock runner output.",
                raw: stdout
            });
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    // Auto-verify and seed demo users if table or rows are missing
    ensureUsersTableAndSeeds();
});
