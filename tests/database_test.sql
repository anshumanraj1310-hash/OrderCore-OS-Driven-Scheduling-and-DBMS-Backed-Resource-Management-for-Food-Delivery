USE ordercore;

SELECT * FROM Customer;

SELECT * FROM Restaurant;

SELECT * FROM Food;

SELECT * FROM Orders;

SELECT * FROM Delivery_Agents;

SELECT
    Orders.order_id,
    Customer.name AS customer_name
FROM Orders
JOIN Customer
ON Orders.customer_id = Customer.customer_id;

SELECT
    Orders.order_id,
    Restaurant.name AS restaurant_name
FROM Orders
JOIN Restaurant
ON Orders.restaurant_id = Restaurant.restaurant_id;

SELECT *
FROM Delivery_Agents
WHERE status = 'Available';

SELECT *
FROM Orders
ORDER BY prep_time;

SELECT *
FROM Orders
ORDER BY priority;

SELECT COUNT(*) AS total_orders
FROM Orders;