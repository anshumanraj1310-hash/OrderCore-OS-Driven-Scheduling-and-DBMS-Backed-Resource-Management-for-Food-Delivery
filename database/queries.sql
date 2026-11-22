USE ordercore;

-- Basic Table Inspections
SELECT * FROM Customer;
SELECT * FROM Restaurant;
SELECT * FROM Food;
SELECT * FROM Orders;
SELECT * FROM Delivery_Agents WHERE status = 'Available';
SELECT * FROM Delivery;
SELECT user_id, name, email, role, status FROM Users;

-- Orders with Customer Details
SELECT
    Orders.order_id,
    Customer.name AS customer_name,
    Orders.status
FROM Orders
JOIN Customer
ON Orders.customer_id = Customer.customer_id;

-- Orders with Restaurant and OS Scheduling Attributes
SELECT
    Orders.order_id,
    Restaurant.name AS restaurant_name,
    Orders.arrival_time,
    Orders.prep_time,
    Orders.priority,
    Orders.status
FROM Orders
JOIN Restaurant
ON Orders.restaurant_id = Restaurant.restaurant_id;

-- Deliveries with Agent Details
SELECT
    Delivery.delivery_id,
    Delivery.order_id,
    Delivery.agent_id,
    Delivery_Agents.name AS agent_name,
    Delivery.status
FROM Delivery
JOIN Delivery_Agents
ON Delivery.agent_id = Delivery_Agents.agent_id;

-- OS Scheduling Order Views (SJF and Priority)
SELECT * FROM Orders ORDER BY prep_time ASC;
SELECT * FROM Orders ORDER BY priority ASC;

-- Aggregate System Statistics
SELECT COUNT(*) AS total_orders FROM Orders;
SELECT COUNT(*) AS available_agents FROM Delivery_Agents WHERE status = 'Available';
SELECT role, status, COUNT(*) AS user_count FROM Users GROUP BY role, status;

-- Full Detailed Order Information
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
JOIN Customer ON Orders.customer_id = Customer.customer_id
JOIN Restaurant ON Orders.restaurant_id = Restaurant.restaurant_id;

-- Order Items with Pricing
SELECT
    Order_Items.order_item_id,
    Order_Items.order_id,
    Food.name AS food_name,
    Order_Items.quantity,
    Food.price,
    (Order_Items.quantity * Food.price) AS subtotal
FROM Order_Items
JOIN Food ON Order_Items.food_id = Food.food_id;
