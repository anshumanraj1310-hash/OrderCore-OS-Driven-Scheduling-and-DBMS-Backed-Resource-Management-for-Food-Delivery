USE ordercore;

SELECT * FROM Customer;

SELECT * FROM Restaurant;

SELECT * FROM Food;

SELECT * FROM Orders;

SELECT *
FROM Delivery_Agents
WHERE status = 'Available';

SELECT
    Orders.order_id,
    Customer.name AS customer_name,
    Orders.status
FROM Orders
JOIN Customer
ON Orders.customer_id = Customer.customer_id;

SELECT
    Orders.order_id,
    Restaurant.name AS restaurant_name,
    Orders.prep_time,
    Orders.priority,
    Orders.status
FROM Orders
JOIN Restaurant
ON Orders.restaurant_id = Restaurant.restaurant_id;

SELECT
    Delivery.delivery_id,
    Delivery.order_id,
    Delivery.agent_id,
    Delivery.status
FROM Delivery;

SELECT *
FROM Orders
ORDER BY prep_time ASC;

SELECT *
FROM Orders
ORDER BY priority ASC;

SELECT COUNT(*) AS total_orders
FROM Orders;

SELECT COUNT(*) AS available_agents
FROM Delivery_Agents
WHERE status = 'Available';

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
ON Orders.restaurant_id = Restaurant.restaurant_id;

SELECT
    Order_Items.order_item_id,
    Order_Items.order_id,
    Food.name AS food_name,
    Order_Items.quantity,
    Food.price
FROM Order_Items
JOIN Food
ON Order_Items.food_id = Food.food_id;