const express = require("express");
const cors = require("cors");

const db = require("./db/connection");

const app = express();

const PORT = 3000;

app.use(cors());
app.use(express.json());


// Home route
app.get("/", (req, res) => {
    res.send("OrderCore Backend is Running");
});


// Get all orders
app.get("/orders", (req, res) => {

    const query = `
        SELECT
            Orders.order_id,
            Customer.name AS customer_name,
            Restaurant.name AS restaurant_name,
            Orders.arrival_time,
            Orders.prep_time,
            Orders.delivery_time,
            Orders.priority,
            Orders.status
        FROM Orders
        JOIN Customer
            ON Orders.customer_id = Customer.customer_id
        JOIN Restaurant
            ON Orders.restaurant_id = Restaurant.restaurant_id
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


// Update order status
app.put("/orders/:id/status", (req, res) => {

    const orderId = req.params.id;
    const { status } = req.body;

    const query = `
        UPDATE Orders
        SET status = ?
        WHERE order_id = ?
    `;

    db.query(query, [status, orderId], (err, result) => {

        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        res.json({
            message: "Order status updated successfully"
        });
    });
});


// Assign delivery agent
app.post("/delivery", (req, res) => {

    const { order_id, agent_id } = req.body;

    const query = `
        INSERT INTO Delivery
        (order_id, agent_id, status)
        VALUES (?, ?, 'Assigned')
    `;

    db.query(query, [order_id, agent_id], (err, result) => {

        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        res.json({
            message: "Delivery assigned successfully",
            delivery_id: result.insertId
        });
    });
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


// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});