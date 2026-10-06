USE ordercore;

-- Customers
INSERT INTO Customer (name, phone, address)
VALUES
('Tushar', '9876543210', 'Dehradun'),
('Rahul', '9876543211', 'Dehradun'),
('Aman', '9876543212', 'Dehradun'),
('Riya', '9876543213', 'Dehradun');

-- Restaurants
INSERT INTO Restaurant (name, location)
VALUES
('Pizza Hub', 'Rajpur Road'),
('Burger Point', 'Clock Tower'),
('Food Corner', 'Prem Nagar');

-- Food Items
INSERT INTO Food (restaurant_id, name, price)
VALUES
(1, 'Margherita Pizza', 250.00),
(1, 'Farmhouse Pizza', 350.00),
(2, 'Veg Burger', 120.00),
(2, 'Cheese Burger', 180.00),
(3, 'Veg Noodles', 150.00);

-- Delivery Agents
INSERT INTO Delivery_Agents (name, status)
VALUES
('Agent A', 'Available'),
('Agent B', 'Available'),
('Agent C', 'Available');

-- Orders
INSERT INTO Orders
(
    customer_id,
    restaurant_id,
    arrival_time,
    prep_time,
    delivery_time,
    priority,
    status
)
VALUES
(1, 1, 0, 5, 4, 2, 'Waiting'),
(2, 1, 1, 3, 5, 1, 'Waiting'),
(3, 2, 2, 7, 3, 3, 'Waiting'),
(4, 3, 3, 4, 6, 2, 'Waiting');

-- Items in Orders
INSERT INTO Order_Items
(order_id, food_id, quantity)
VALUES
(1, 1, 2),
(2, 2, 1),
(3, 3, 2),
(4, 5, 1);