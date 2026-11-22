USE ordercore;

-- Table verification
SELECT COUNT(*) AS customer_count FROM Customer;
SELECT COUNT(*) AS restaurant_count FROM Restaurant;
SELECT COUNT(*) AS food_count FROM Food;
SELECT COUNT(*) AS order_count FROM Orders;
SELECT COUNT(*) AS agent_count FROM Delivery_Agents;
SELECT COUNT(*) AS delivery_count FROM Delivery;
SELECT COUNT(*) AS user_count FROM Users;

-- Query joins check
SELECT
    Orders.order_id,
    Customer.name AS customer_name,
    Restaurant.name AS restaurant_name,
    Orders.status
FROM Orders
JOIN Customer ON Orders.customer_id = Customer.customer_id
JOIN Restaurant ON Orders.restaurant_id = Restaurant.restaurant_id;

-- Delivery assignment check
SELECT
    Delivery.delivery_id,
    Orders.order_id,
    Delivery_Agents.name AS agent_name,
    Delivery.status
FROM Delivery
JOIN Orders ON Delivery.order_id = Orders.order_id
JOIN Delivery_Agents ON Delivery.agent_id = Delivery_Agents.agent_id;

-- Pending account approvals check
SELECT user_id, name, email, role, status
FROM Users
WHERE status = 'Pending';
