require("dotenv").config();
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");

const connectionConfig = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : "",
    database: process.env.DB_NAME || "ordercore",
    multipleStatements: true
};

const db = mysql.createConnection(connectionConfig);

db.connect(async (err) => {
    if (err) {
        console.error("❌ MySQL Connection Failed:", err.message);
        console.error("Please ensure MySQL server is running and database 'ordercore' exists.");
        process.exit(1);
    }

    console.log(" Connected to MySQL database:", connectionConfig.database);

    try {
        console.log("🛠️  Creating tables if not exists...");

        await runQuery(`
            CREATE TABLE IF NOT EXISTS Customer (
                customer_id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL,
                phone VARCHAR(15),
                address VARCHAR(255)
            );
        `);

        await runQuery(`
            CREATE TABLE IF NOT EXISTS Restaurant (
                restaurant_id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL,
                location VARCHAR(100) NOT NULL
            );
        `);

        await runQuery(`
            CREATE TABLE IF NOT EXISTS Food (
                food_id INT PRIMARY KEY AUTO_INCREMENT,
                restaurant_id INT NOT NULL,
                name VARCHAR(100) NOT NULL,
                price DECIMAL(8,2) NOT NULL,
                FOREIGN KEY (restaurant_id) REFERENCES Restaurant(restaurant_id) ON DELETE CASCADE
            );
        `);

        await runQuery(`
            CREATE TABLE IF NOT EXISTS Delivery_Agents (
                agent_id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL,
                status VARCHAR(20) DEFAULT 'Available'
            );
        `);

        await runQuery(`
            CREATE TABLE IF NOT EXISTS Orders (
                order_id INT PRIMARY KEY AUTO_INCREMENT,
                customer_id INT NOT NULL,
                restaurant_id INT NOT NULL,
                arrival_time INT DEFAULT 0,
                prep_time INT NOT NULL,
                delivery_time INT NOT NULL,
                priority INT DEFAULT 2,
                status VARCHAR(30) DEFAULT 'Waiting',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES Customer(customer_id) ON DELETE CASCADE,
                FOREIGN KEY (restaurant_id) REFERENCES Restaurant(restaurant_id) ON DELETE CASCADE
            );
        `);

        await runQuery(`
            CREATE TABLE IF NOT EXISTS Order_Items (
                order_item_id INT PRIMARY KEY AUTO_INCREMENT,
                order_id INT NOT NULL,
                food_id INT NOT NULL,
                quantity INT NOT NULL,
                FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE,
                FOREIGN KEY (food_id) REFERENCES Food(food_id) ON DELETE CASCADE
            );
        `);

        await runQuery(`
            CREATE TABLE IF NOT EXISTS Delivery (
                delivery_id INT PRIMARY KEY AUTO_INCREMENT,
                order_id INT NOT NULL,
                agent_id INT NOT NULL,
                status VARCHAR(30) DEFAULT 'Assigned',
                assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE,
                FOREIGN KEY (agent_id) REFERENCES Delivery_Agents(agent_id) ON DELETE CASCADE
            );
        `);

        await runQuery(`
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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES Customer(customer_id) ON DELETE CASCADE,
                FOREIGN KEY (restaurant_id) REFERENCES Restaurant(restaurant_id) ON DELETE CASCADE,
                FOREIGN KEY (agent_id) REFERENCES Delivery_Agents(agent_id) ON DELETE CASCADE
            );
        `);

        console.log(" Seeding Customers, Restaurants & Delivery Agents...");

        await runQuery(`
            INSERT INTO Restaurant (restaurant_id, name, location) VALUES
            (1, 'Pizza Hub', 'Rajpur Road, Dehradun'),
            (2, 'Burger Point', 'Clock Tower, Dehradun'),
            (3, 'Food Corner', 'Prem Nagar, Dehradun'),
            (4, 'Spice Garden', 'Sahastradhara Road, Dehradun'),
            (5, 'South Bite', 'GMS Road, Dehradun'),
            (6, 'Rolls N More', 'Ballupur Chowk, Dehradun'),
            (7, 'Dessert Den', 'Paltan Bazaar, Dehradun')
            ON DUPLICATE KEY UPDATE name=VALUES(name), location=VALUES(location);
        `);

        await runQuery(`
            INSERT INTO Customer (customer_id, name, phone, address) VALUES
            (1, 'Tushar', '9876543210', '12 Rajpur Road, Dehradun'),
            (2, 'Rahul', '9876543211', '45 Clock Tower, Dehradun'),
            (3, 'Aman', '9876543212', '78 Prem Nagar, Dehradun'),
            (4, 'Riya', '9876543213', '89 Clement Town, Dehradun')
            ON DUPLICATE KEY UPDATE name=VALUES(name), phone=VALUES(phone), address=VALUES(address);
        `);

        await runQuery(`
            INSERT INTO Delivery_Agents (agent_id, name, status) VALUES
            (1, 'Agent A (Arun)', 'Available'),
            (2, 'Agent B (Bikram)', 'Available'),
            (3, 'Agent C (Chandan)', 'Available'),
            (4, 'Agent D (Deepak)', 'Available'),
            (5, 'Agent E (Ekta)', 'Available')
            ON DUPLICATE KEY UPDATE name=VALUES(name);
        `);

        console.log("🍕 Seeding Food Catalog (50+ Items)...");
        await runQuery(`
            INSERT INTO Food (food_id, restaurant_id, name, price) VALUES
            (1, 1, 'Margherita Pizza', 250.00),
            (2, 1, 'Farmhouse Pizza', 350.00),
            (3, 1, 'Paneer Tikka Pizza', 380.00),
            (4, 1, 'Garlic Breadsticks', 140.00),
            (5, 1, 'Choco Lava Cake', 110.00),
            (6, 1, 'Pepsi Cold Beverage', 60.00),
            (7, 2, 'Veg Burger', 120.00),
            (8, 2, 'Cheese Burger', 180.00),
            (9, 2, 'Crispy Paneer Burger', 190.00),
            (10, 2, 'Peri Peri Fries', 110.00),
            (11, 2, 'Chocolate Thick Shake', 160.00),
            (12, 2, 'Crispy Chicken Burger', 220.00),
            (13, 3, 'Veg Noodles', 150.00),
            (14, 3, 'Schezwan Fried Rice', 180.00),
            (15, 3, 'Paneer Butter Masala', 260.00),
            (16, 3, 'Butter Naan', 45.00),
            (17, 3, 'Veg Dum Biryani', 220.00),
            (18, 3, 'Chicken Biryani', 290.00),
            (19, 3, 'Paneer Kathi Roll', 140.00),
            (20, 3, 'Gulab Jamun (2 Pcs)', 80.00),
            (21, 4, 'Butter Chicken', 320.00),
            (22, 4, 'Dal Makhani', 240.00),
            (23, 4, 'Palak Paneer', 260.00),
            (24, 4, 'Tandoori Roti', 35.00),
            (25, 4, 'Chicken Tikka (6 Pcs)', 350.00),
            (26, 4, 'Mixed Veg Curry', 220.00),
            (27, 4, 'Lassi (Sweet / Salted)', 90.00),
            (28, 4, 'Shahi Paneer', 290.00),
            (29, 5, 'Masala Dosa', 130.00),
            (30, 5, 'Idli Sambar (4 Pcs)', 100.00),
            (31, 5, 'Vada (2 Pcs)', 80.00),
            (32, 5, 'Uttapam', 140.00),
            (33, 5, 'Pongal', 120.00),
            (34, 5, 'Coconut Chutney', 40.00),
            (35, 5, 'Filter Coffee', 60.00),
            (36, 5, 'Medu Vada (2 Pcs)', 90.00),
            (37, 6, 'Paneer Tikka Roll', 160.00),
            (38, 6, 'Egg Roll', 110.00),
            (39, 6, 'Chicken Tikka Roll', 180.00),
            (40, 6, 'Cheese Corn Roll', 150.00),
            (41, 6, 'Double Egg Paratha', 130.00),
            (42, 6, 'Aloo Paratha with Butter', 100.00),
            (43, 6, 'Lassi', 80.00),
            (44, 6, 'Veg Frankie', 120.00),
            (45, 7, 'Chocolate Brownie', 130.00),
            (46, 7, 'Tiramisu', 180.00),
            (47, 7, 'Mango Kulfi', 90.00),
            (48, 7, 'Belgian Waffle', 160.00),
            (49, 7, 'Vanilla Ice Cream Sundae', 140.00),
            (50, 7, 'Strawberry Cheesecake', 200.00),
            (51, 7, 'Cold Coffee', 110.00),
            (52, 7, 'Hot Chocolate', 120.00),
            (53, 1, 'BBQ Chicken Pizza', 420.00),
            (54, 1, 'Pasta Arabiata', 220.00),
            (55, 2, 'Double Patty Burger', 260.00),
            (56, 2, 'Onion Rings', 90.00)
            ON DUPLICATE KEY UPDATE name=VALUES(name), price=VALUES(price);
        `);

        console.log(" Seeding Initial Kitchen Orders & Order Items...");
        await runQuery(`
            INSERT INTO Orders (order_id, customer_id, restaurant_id, arrival_time, prep_time, delivery_time, priority, status) VALUES
            (1, 1, 1, 0, 5, 4, 2, 'Waiting'),
            (2, 2, 1, 1, 3, 5, 1, 'Waiting'),
            (3, 3, 2, 2, 7, 3, 3, 'Waiting'),
            (4, 4, 3, 3, 4, 6, 2, 'Waiting')
            ON DUPLICATE KEY UPDATE status=VALUES(status), priority=VALUES(priority);
        `);

        await runQuery(`
            INSERT INTO Order_Items (order_item_id, order_id, food_id, quantity) VALUES
            (1, 1, 1, 2),
            (2, 2, 2, 1),
            (3, 3, 7, 2),
            (4, 4, 13, 1)
            ON DUPLICATE KEY UPDATE quantity=VALUES(quantity);
        `);

        await runQuery(`
            INSERT INTO Delivery (delivery_id, order_id, agent_id, status) VALUES
            (1, 1, 1, 'Assigned')
            ON DUPLICATE KEY UPDATE status=VALUES(status);
        `);

        console.log("🔐 Seeding User Accounts (Bcrypt Hashes)...");
        const adminHash = await bcrypt.hash("admin123", 10);
        const passHash = await bcrypt.hash("password123", 10);

        const users = [
            { name: "System Administrator", email: "admin@ordercore.com", hash: adminHash, role: "admin", cid: null, rid: null, aid: null },
            { name: "Tushar", email: "tushar@example.com", hash: passHash, role: "customer", cid: 1, rid: null, aid: null },
            { name: "Rahul", email: "rahul@example.com", hash: passHash, role: "customer", cid: 2, rid: null, aid: null },
            { name: "Pizza Hub Manager", email: "pizzahub@example.com", hash: passHash, role: "restaurant", cid: null, rid: 1, aid: null },
            { name: "Burger Point Manager", email: "burgerpoint@example.com", hash: passHash, role: "restaurant", cid: null, rid: 2, aid: null },
            { name: "Food Corner Manager", email: "foodcorner@example.com", hash: passHash, role: "restaurant", cid: null, rid: 3, aid: null },
            { name: "Agent A (Arun)", email: "agenta@example.com", hash: passHash, role: "delivery_agent", cid: null, rid: null, aid: 1 },
            { name: "Agent B (Bikram)", email: "agentb@example.com", hash: passHash, role: "delivery_agent", cid: null, rid: null, aid: 2 },
            { name: "Agent C (Chandan)", email: "agentc@example.com", hash: passHash, role: "delivery_agent", cid: null, rid: null, aid: 3 },
            { name: "Agent D (Deepak)", email: "agentd@example.com", hash: passHash, role: "delivery_agent", cid: null, rid: null, aid: 4 },
            { name: "Agent E (Ekta)", email: "agente@example.com", hash: passHash, role: "delivery_agent", cid: null, rid: null, aid: 5 },
            { name: "Spice Garden Manager", email: "spicegarden@example.com", hash: passHash, role: "restaurant", cid: null, rid: 4, aid: null },
            { name: "South Bite Manager", email: "southbite@example.com", hash: passHash, role: "restaurant", cid: null, rid: 5, aid: null },
            { name: "Rolls N More Manager", email: "rollsnmore@example.com", hash: passHash, role: "restaurant", cid: null, rid: 6, aid: null },
            { name: "Dessert Den Manager", email: "dessertden@example.com", hash: passHash, role: "restaurant", cid: null, rid: 7, aid: null }
        ];

        for (const u of users) {
            await runQuery(`
                INSERT INTO Users (name, email, password_hash, role, customer_id, restaurant_id, agent_id, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'Approved')
                ON DUPLICATE KEY UPDATE
                    password_hash = VALUES(password_hash),
                    role = VALUES(role),
                    status = 'Approved',
                    customer_id = VALUES(customer_id),
                    restaurant_id = VALUES(restaurant_id),
                    agent_id = VALUES(agent_id);
            `, [u.name, u.email, u.hash, u.role, u.cid, u.rid, u.aid]);

            console.log(`   ✓ ${u.role.padEnd(15)} | ${u.email.padEnd(25)} | Password: ${u.role === 'admin' ? 'admin123' : 'password123'}`);
        }

        console.log("\n🎉 ALL OrderCore tables, food catalog, live orders & accounts seeded successfully!");
        process.exit(0);

    } catch (e) {
        console.error("❌ Error during database seeding:", e.message);
        process.exit(1);
    }
});

function runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
}
